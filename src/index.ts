import express from "express";
import subjectsRouter from "./routes/subjects.js";
import cors from "cors";

const app = express();
const port = 8000;

app.use(express.json());

if(!process.env.FRONTEND_URL) throw new Error("FRONTEND_URL is not defined in the environment variables.");
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use("/api/subjects", subjectsRouter);

app.get("/", (_request, response) => {
  response.send("Classroom server is running.");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});