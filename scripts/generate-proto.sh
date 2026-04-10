#!/bin/bash

# Configuration
PROTO_DIR="go-services/proto"
GO_OUT_DIR="go-services/proto/generated"
PYTHON_OUT_DIR="python-ai-service/grpc_server/generated"

# Create output directories if they don't exist
mkdir -p "$GO_OUT_DIR"
mkdir -p "$PYTHON_OUT_DIR"

echo "🚀 Generating gRPC code from ${PROTO_DIR}..."

# --- Generate Go Code ---
echo "🔹 Generating Go code into ${GO_OUT_DIR}..."
protoc --proto_path="${PROTO_DIR}" \
  --go_out="${GO_OUT_DIR}" --go_opt=paths=source_relative \
  --go-grpc_out="${GO_OUT_DIR}" --go-grpc_opt=paths=source_relative \
  "${PROTO_DIR}"/*.proto

# --- Generate Python Code ---
echo "🔹 Generating Python code into ${PYTHON_OUT_DIR}..."
python3 -m grpc_tools.protoc -I"${PROTO_DIR}" \
  --python_out="${PYTHON_OUT_DIR}" \
  --grpc_python_out="${PYTHON_OUT_DIR}" \
  "${PROTO_DIR}"/*.proto

# Create __init__.py for Python package if it doesn't exist
touch "${PYTHON_OUT_DIR}/__init__.py"

echo "✅ gRPC generation complete!"
