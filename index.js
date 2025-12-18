import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { cronScheduler } from "./services/serviceManager.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Import routes after setting up express
import gitAgentRoutes from "./routes/gitAgentRoutes.js";
import codeUpdateRoutes from "./routes/codeUpdateRoutes.js";

app.use("/api/git-agent", gitAgentRoutes);
app.use("/api/code-update", codeUpdateRoutes);

// Simple health endpoint to keep server alive
app.get("/health", (req, res) => {
    console.log("🟢 Health check - Server is alive");
    res.json({ status: "OK", message: "Server is alive" });
});

// Start server without cron scheduler (will be started manually after first API call)
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log("⏰ Cron scheduler will start after first project initialization");

    // Auto-ping health endpoint to keep server alive (for Render free tier)
    // Uses RENDER_EXTERNAL_URL if available (Render provides this), otherwise uses custom URL
    const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.SELF_PING_URL;
    if (externalUrl && process.env.NODE_ENV === 'production') {
        console.log(`🔄 Self-ping enabled: ${externalUrl}/health`);
        setInterval(async () => {
            try {
                const response = await fetch(`${externalUrl}/health`);
                if (response.ok) {
                    console.log("✅ Self-ping successful");
                }
            } catch (error) {
                console.log("❌ Self-ping error:", error.message);
            }
        }, 10 * 60 * 1000); // Every 10 minutes
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    cronScheduler.stop();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    cronScheduler.stop();
    process.exit(0);
});
