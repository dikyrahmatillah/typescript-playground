# Stage 1: Build stage
FROM alpine:3.20 AS builder

# Install required tools for the build stage
RUN apk add --no-cache nodejs npm

# Create and set working directory
WORKDIR /build

# Copy all files
COPY . .

# Install any dependencies (if package.json exists)
RUN if [ -f package.json ]; then npm install; fi

# Stage 2: Production stage
FROM nginx:alpine-slim

# Copy the built/prepared files from builder stage
COPY --from=builder /build /usr/share/nginx/html

# Expose port 80 for the server
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]