import express from "express";
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import {roleEnum, user} from "../db/schema/auth.js";
import {db} from "../db/index.js";

const router = express.Router();

const isUserRole = (value: string): value is (typeof roleEnum.enumValues)[number] =>
    roleEnum.enumValues.some((role) => role === value);

router.get("/", async (req, res) => {
    try {
        const {search, role, page=1, limit=10} = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100);

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            const searchTerm = String(search);
            filterConditions.push(
                or(
                    ilike(user.name, `%${searchTerm}%`),
                    ilike(user.email, `%${searchTerm}%`)
                )
            );
        }

        if (role !== undefined) {
            if (typeof role !== "string" || !isUserRole(role)) {
                return res.status(400).json({error: "Invalid role"});
            }
            filterConditions.push(eq(user.role, role));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;
        const countResult = await db
            .select({count: sql<number>`count(*)`})
            .from(user)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const usersResult = await db
            .select({...getTableColumns(user)})
            .from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: usersResult,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });
    } catch (e) {
        console.error(`GET /users error: ${e}`);
        res.status(500).json({error: "Failed to get users"});
    }
});

export default router;
