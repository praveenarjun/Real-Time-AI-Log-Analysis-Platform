FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev protobuf-dev
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.33.0 && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0

# Copy shared modules
COPY go.mod go.sum ./
ENV GOPROXY=https://proxy.golang.org,direct
RUN go mod download

# Copy source code and protos
COPY . .

# Generate gRPC code autonomously
RUN mkdir -p proto/generated && protoc --proto_path=proto \
    --go_out=proto/generated --go_opt=module=praveenchalla.local/ai-log-analyzer \
    --go-grpc_out=proto/generated --go-grpc_opt=module=praveenchalla.local/ai-log-analyzer \
    proto/*.proto

# Build the binary with optimized memory settings
RUN CGO_ENABLED=0 GOOS=linux go build -p 1 -ldflags="-s -w" -o main ./api-gateway/cmd/main.go

# --- Runtime Stage ---
FROM alpine:3.19

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /home/appuser

# Install ca-certificates and healthcheck tools
RUN apk --no-cache add ca-certificates curl

# Copy binary from builder
COPY --from=builder /app/main .

# Copy config directory for environment settings
COPY --from=builder /app/config ./config

# Ensure correct permissions
RUN chown -R appuser:appgroup /home/appuser

USER appuser

# Expose HTTP port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["./main"]
