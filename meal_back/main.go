package main

import (
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"meal_back/handlers"
	"meal_back/middlewares"
	"meal_back/models"
	"meal_back/stores"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	logFile := configureLogging()
	if logFile != nil {
		defer logFile.Close()
	}

	dsn := os.Getenv("DB_DSN")
	jwtSecret := os.Getenv("JWT_SECRET")
	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8080"
	}

	if dsn == "" {
		log.Fatal("Missing environment variable DB_DSN")
	}
	if jwtSecret == "" {
		log.Fatal("Missing environment variable JWT_SECRET")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 迁移顺序：先用户主表，再会话/资料/业务记录表。
	if err := db.AutoMigrate(
		&models.User{},
		&models.UserSession{},
		&models.UserProfile{},
		&models.MealRecord{},
		&models.ActivityRecord{},
	); err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}

	tokenBlacklist := stores.NewTokenBlacklistStore()
	authHandler := handlers.NewAuthHandler(db, jwtSecret, tokenBlacklist)
	nutritionHandler := handlers.NewNutritionHandler(db)

	r := gin.Default()
	r.Use(middlewares.CORSMiddleware())

	corsOrigins := strings.TrimSpace(os.Getenv("CORS_ALLOW_ORIGINS"))
	if corsOrigins == "" {
		log.Println("CORS_ALLOW_ORIGINS is empty; allowing all origins.")
	} else {
		log.Printf("CORS allowed origins: %s", corsOrigins)
	}

	apiV1 := r.Group("/api/v1")
	{
		apiV1.POST("/register", authHandler.Register)
		apiV1.POST("/login", authHandler.Login)
		apiV1.POST("/refresh", authHandler.RefreshToken)

		authed := apiV1.Group("")
		authed.Use(middlewares.AuthMiddleware(db, jwtSecret, tokenBlacklist))
		authed.GET("/private/me", authHandler.Me)
		authed.POST("/private/logout", authHandler.Logout)
		authed.PUT("/private/me/profile", authHandler.UpsertProfile)
		authed.POST("/private/me/profile", authHandler.UpsertProfile)
		authed.PUT("/users/me/profile", authHandler.UpsertProfile)
		authed.POST("/users/me/profile", authHandler.UpsertProfile)
		authed.PUT("/users/me/preferences", nutritionHandler.UpsertPreferences)
		authed.PUT("/private/me/preferences", nutritionHandler.UpsertPreferences)

		authed.GET("/meals", nutritionHandler.GetMealsByDate)
		authed.POST("/meals", nutritionHandler.CreateMeal)
		authed.PUT("/meals/:id", nutritionHandler.UpdateMeal)
		authed.DELETE("/meals/:id", nutritionHandler.DeleteMeal)

		authed.GET("/activities", nutritionHandler.GetActivitiesByDate)
		authed.POST("/activities", nutritionHandler.CreateActivity)
		authed.PUT("/activities/:id", nutritionHandler.UpdateActivity)
		authed.DELETE("/activities/:id", nutritionHandler.DeleteActivity)

		authed.POST("/recommendations", nutritionHandler.GetRecommendation)
		authed.GET("/recommendations/prompt", nutritionHandler.PreviewRecommendationPrompt)

		// analyze image of meal by AI
		authed.POST("/meals/analyze-image", nutritionHandler.AnalyzeMealImage)
	}

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func configureLogging() *os.File {
	logDir := strings.TrimSpace(os.Getenv("LOG_DIR"))
	if logDir == "" {
		logDir = "log"
	}

	if err := os.MkdirAll(logDir, 0o755); err != nil {
		log.Printf("Failed to create log directory %s: %v", logDir, err)
		return nil
	}

	logPath := filepath.Join(logDir, "backend.log")
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		log.Printf("Failed to open log file %s: %v", logPath, err)
		return nil
	}

	multiWriter := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(multiWriter)
	gin.DefaultWriter = multiWriter
	gin.DefaultErrorWriter = multiWriter
	log.Printf("Logging to %s", logPath)
	return logFile
}
