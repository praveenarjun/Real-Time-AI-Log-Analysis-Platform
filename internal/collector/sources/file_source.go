package sources

import (
	"bufio"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"praveenchalla.local/ai-log-analyzer/internal/models"
	"github.com/fsnotify/fsnotify"
	"github.com/google/uuid"
)

type FileSource struct {
	paths     []string
	watcher   *fsnotify.Watcher
	positions map[string]int64
	logger    *slog.Logger
	mu        sync.Mutex
	cancel    context.CancelFunc
}

func NewFileSource(paths []string, logger *slog.Logger) *FileSource {
	return &FileSource{
		paths:     paths,
		positions: make(map[string]int64),
		logger:    logger,
	}
}

func (f *FileSource) Name() string {
	return "FILE_SOURCE"
}

func (f *FileSource) Start(ctx context.Context, output chan<- models.LogEntry) error {
	var err error
	f.watcher, err = fsnotify.NewWatcher()
	if err != nil {
		return err
	}

	innerCtx, cancel := context.WithCancel(ctx)
	f.cancel = cancel

	for _, path := range f.paths {
		// Support globs
		matches, _ := filepath.Glob(path)
		for _, match := range matches {
			if err := f.watcher.Add(match); err != nil {
				f.logger.Error("Failed to watch file", "path", match, "error", err)
				continue
			}
			f.mu.Lock()
			info, _ := os.Stat(match)
			if info != nil {
				f.positions[match] = info.Size()
			}
			f.mu.Unlock()
		}
	}

	go f.watchLoop(innerCtx, output)
	return nil
}

func (f *FileSource) Stop() error {
	if f.cancel != nil {
		f.cancel()
	}
	if f.watcher != nil {
		return f.watcher.Close()
	}
	return nil
}

func (f *FileSource) watchLoop(ctx context.Context, output chan<- models.LogEntry) {
	for {
		select {
		case <-ctx.Done():
			return
		case event, ok := <-f.watcher.Events:
			if !ok {
				return
			}
			if event.Op&fsnotify.Write == fsnotify.Write {
				f.processFile(event.Name, output)
			}
			if event.Op&fsnotify.Create == fsnotify.Create {
				f.watcher.Add(event.Name)
				f.processFile(event.Name, output)
			}
		case err, ok := <-f.watcher.Errors:
			if !ok {
				return
			}
			f.logger.Error("Watcher error", "error", err)
		}
	}
}

func (f *FileSource) processFile(path string, output chan<- models.LogEntry) {
	f.mu.Lock()
	pos := f.positions[path]
	f.mu.Unlock()

	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	info, _ := file.Stat()
	if info.Size() < pos {
		// Truncated/Rotated
		pos = 0
	}

	_, _ = file.Seek(pos, 0)
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}

		var entry models.LogEntry
		// Try JSON
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			// Fallback plain text
			entry = models.NewLogEntry()
			entry.Message = line
			entry.Level = models.LevelInfo
			entry.Source = models.SourceApp
			entry.ServiceName = filepath.Base(path)
		}

		if entry.ID == "" {
			entry.ID = uuid.New().String()
		}
		if entry.Timestamp.IsZero() {
			entry.Timestamp = time.Now()
		}
		output <- entry
	}

	newPos, _ := file.Seek(0, io.SeekCurrent)
	f.mu.Lock()
	f.positions[path] = newPos
	f.mu.Unlock()
}
