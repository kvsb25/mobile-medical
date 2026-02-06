package database

import (
	"context"
	"log"

	"github.com/go-redis/redis/v8"
)

var RedisClient *redis.Client
var Ctx = context.Background()

func InitializeRedisClient() {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	_, err := RedisClient.Ping(Ctx).Result()
	if err != nil {
		log.Fatalf("Redis is not connected: %v", err)
	}
}

func GetRedisClient() *redis.Client {
	if RedisClient == nil {
		InitializeRedisClient()
	}
	return RedisClient
}
