package consumer

import (
	"os"
	"strings"
)

// KafkaBrokerAddrs returns broker addresses from KAFKA_BROKER (comma-separated) or localhost for local dev.
func KafkaBrokerAddrs() []string {
	s := strings.TrimSpace(os.Getenv("KAFKA_BROKER"))
	if s == "" {
		return []string{"localhost:9092"}
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return []string{"localhost:9092"}
	}
	return out
}
