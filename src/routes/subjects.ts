import express from "express";
import {or, ilike, and, sql, eq, getTableColumns, desc} from "drizzle-orm";
import {subjects, departments} from "../db/schema/app.js";
import {db} from "../db/index.js";

const router = express.Router();

//this route will get all subjects and optional search with filtering an pagination
router.get("/", async (req, res) => {
    try {
        const {search, department, page=1, limit=10} = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100);

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        //if search query exists, filter by subject name or code
        if (search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`)
                )
            );
        }

        //if department query exists, filter by department name
        if (department) {
            const deptPattern = `%${String(department).replace(/[%_]/g, '\\$&')}%`;
            filterConditions.push(ilike(departments.name, deptPattern));
        }

        //combine all filter conditions using AND operator
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;
        const countResult = await db
            .select({count: sql<number>`count(*)`})
            .from(subjects)
            .leftJoin(departments, eq(subjects.department_id, departments.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const subjectsResult = await db.select({ ...getTableColumns(subjects), 
        department: { ...getTableColumns(departments) }
        }).from(subjects).leftJoin(departments, eq(subjects.department_id, departments.id))
        .where(whereClause)
        .orderBy(desc(subjects.created_at))
        .limit(limitPerPage)
        .offset(offset);

        res.status(200).json({
            data: subjectsResult,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        })

    } catch (e) {
        console.error(`GET /subjects error: ${e}`);
        res.status(500).json({ error: "Failed to get subjects" });
    }
});

export default router;