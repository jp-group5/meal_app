package middlewares

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware handles browser cross-origin requests.
// Configure strict origins via CORS_ALLOW_ORIGINS (comma-separated).
// If unset, it falls back to allow-all for easier local/dev deployment.
func CORSMiddleware() gin.HandlerFunc {
	allowedOrigins := parseAllowedOrigins(os.Getenv("CORS_ALLOW_ORIGINS"))
	allowAll := len(allowedOrigins) == 0

	return func(c *gin.Context) {
		origin := strings.TrimSpace(c.GetHeader("Origin"))
		originAllowed := origin != "" && (allowAll || isOriginAllowed(origin, allowedOrigins))

		if originAllowed {
			if allowAll {
				c.Header("Access-Control-Allow-Origin", "*")
			} else {
				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Vary", "Origin")
			}
			c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type,Accept,Origin")
			c.Header("Access-Control-Max-Age", "86400")
		}

		if c.Request.Method == http.MethodOptions {
			if originAllowed || origin == "" {
				c.AbortWithStatus(http.StatusNoContent)
				return
			}
			c.AbortWithStatus(http.StatusForbidden)
			return
		}

		c.Next()
	}
}

func parseAllowedOrigins(raw string) map[string]struct{} {
	result := map[string]struct{}{}
	for _, item := range strings.Split(raw, ",") {
		trimmed := strings.TrimSpace(item)
		if trimmed == "" {
			continue
		}
		result[trimmed] = struct{}{}
	}
	return result
}

func isOriginAllowed(origin string, allowed map[string]struct{}) bool {
	_, ok := allowed[origin]
	return ok
}
