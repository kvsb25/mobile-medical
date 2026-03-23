package initiliazers

import (
	"log"

	"github.com/joho/godotenv"
)

func LoadEnvVariable() {
	if err := godotenv.Load(); err != nil {
		log.Printf("optional .env not loaded: %v", err)
	}
}
