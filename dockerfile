# Use Golang base image to build the app
FROM golang:1.24 AS builder

ENV GOARCH=amd64
ENV GOOS=linux
WORKDIR /app

COPY . .

RUN go mod tidy && go build -o main-service .

FROM debian:bullseye-slim

WORKDIR /app

COPY --from=builder /app/main-service .

RUN apt-get update && apt-get install -y ca-certificates


EXPOSE 2426


CMD ["./main-service"]