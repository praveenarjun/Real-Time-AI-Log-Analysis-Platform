FROM golang:1.24-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev protobuf-dev
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.33.0 && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0

WORKDIR /app

# Copy all praveenchalla.local/ai-log-analyzer (due to internal dependencies)
COPY . .

# Generate gRPC code autonomously
RUN mkdir -p proto/generated && protoc --proto_path=proto \
    --go_out=proto/generated --go_opt=module=praveenchalla.local/ai-log-analyzer \
    --go-grpc_out=proto/generated --go-grpc_opt=module=praveenchalla.local/ai-log-analyzer \
    proto/*.proto

# Build the workforce-service with optimized memory settings
ENV GOPROXY=https://proxy.golang.org,direct
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -p 1 -ldflags="-s -w" -o workforce-bin ./workforce-service/cmd/main.go

# --- Production Stage ---
FROM alpine:3.19

WORKDIR /app

# Copy the binary from the build stage
COPY --from=builder /app/workforce-bin .
COPY --from=builder /app/config/config.yaml ./config.yaml

# Minimal operational setup
RUN apk add --no-cache ca-certificates

# Production-ready configuration:
# Environment variables like DATABASE_URL and KAFKA_BROKERS are managed 
# by Kubernetes Secrets/ConfigMaps to ensures external service connectivity.
EXPOSE 8082

ENTRYPOINT ["./workforce-bin"]
