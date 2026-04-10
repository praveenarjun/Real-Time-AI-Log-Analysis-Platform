package buffer

import (
	"sync"
	"praveenchalla.local/ai-log-analyzer/internal/models"
)

type RingBuffer struct {
	mu     sync.Mutex
	data   []models.LogBatch
	head   int
	tail   int
	size   int
	count  int
}

func NewRingBuffer(size int) *RingBuffer {
	return &RingBuffer{
		data: make([]models.LogBatch, size),
		size: size,
	}
}

func (r *RingBuffer) Add(batch models.LogBatch) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.data[r.tail] = batch
	r.tail = (r.tail + 1) % r.size

	if r.count < r.size {
		r.count++
	} else {
		// Overwriting oldest
		r.head = (r.head + 1) % r.size
	}
	return true
}

func (r *RingBuffer) Get() (models.LogBatch, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.count == 0 {
		return models.LogBatch{}, false
	}

	batch := r.data[r.head]
	r.head = (r.head + 1) % r.size
	r.count--

	return batch, true
}

func (r *RingBuffer) Len() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.count
}

func (r *RingBuffer) IsFull() bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.count == r.size
}
