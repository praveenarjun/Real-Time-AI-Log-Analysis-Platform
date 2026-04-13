package repository

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"praveenchalla.local/ai-log-analyzer/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WorkforceRepository struct {
	pool   *pgxpool.Pool
	logger *slog.Logger
}

func NewWorkforceRepository(pool *pgxpool.Pool, logger *slog.Logger) *WorkforceRepository {
	return &WorkforceRepository{
		pool:   pool,
		logger: logger,
	}
}

func (r *WorkforceRepository) CreateEmployee(ctx context.Context, emp *models.Employee) error {
	// Generate EMP-001 sequential code logic
	var lastCount int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM "Employees"`).Scan(&lastCount)
	if err != nil {
		return fmt.Errorf("failed to get employee count: %w", err)
	}
	emp.EmployeeCode = fmt.Sprintf("EMP-%03d", lastCount+1)
	emp.CreatedAt = time.Now()
	emp.UpdatedAt = time.Now()

	query := `INSERT INTO "Employees" (
		"id", "EmployeeCode", "FirstName", "LastName", "Email", "DepartmentId", "HireDate", "Position", "Salary", "IsActive", "CreatedAt", "UpdatedAt"
	) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

	_, err = r.pool.Exec(ctx, query,
		uuid.New(), emp.EmployeeCode, emp.FirstName, emp.LastName, emp.Email, emp.DepartmentID, 
		emp.HireDate, emp.Position, emp.Salary, true, emp.CreatedAt, emp.UpdatedAt,
	)
	return err
}

func (r *WorkforceRepository) RecordAttendance(ctx context.Context, att *models.Attendance) error {
	query := `INSERT INTO "Attendance" (
		"id", "EmployeeId", "Date", "CheckIn", "Status", "CreatedAt", "UpdatedAt"
	) VALUES ($1, $2, $3, $4, $5, $6, $7)
	ON CONFLICT ("EmployeeId", "Date") DO UPDATE SET "CheckIn" = EXCLUDED."CheckIn", "UpdatedAt" = EXCLUDED."UpdatedAt"`

	_, err := r.pool.Exec(ctx, query,
		uuid.New(), att.EmployeeID, att.Date, att.CheckIn, att.Status, time.Now(), time.Now(),
	)
	return err
}

func (r *WorkforceRepository) GetDepartmentHeadcount(ctx context.Context) ([]map[string]interface{}, error) {
	rows, err := r.pool.Query(ctx, `SELECT "DepartmentName", "Headcount", "SalaryPercentage" FROM "GetDepartmentHeadcount"()`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var name string
		var headcount int64
		var percentage float64
		if err := rows.Scan(&name, &headcount, &percentage); err != nil {
			return nil, err
		}
		results = append(results, map[string]interface{}{
			"department": name,
			"headcount":  headcount,
			"salary_pct": percentage,
		})
	}
	return results, nil
}

func (r *WorkforceRepository) ListEmployees(ctx context.Context) ([]models.Employee, error) {
	rows, err := r.pool.Query(ctx, `SELECT "id", "EmployeeCode", "FirstName", "LastName", "DepartmentId", "Position", "IsActive" FROM "Employees"`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var employees []models.Employee
	for rows.Next() {
		var e models.Employee
		if err := rows.Scan(&e.ID, &e.EmployeeCode, &e.FirstName, &e.LastName, &e.DepartmentID, &e.Position, &e.IsActive); err != nil {
			return nil, err
		}
		employees = append(employees, e)
	}
	return employees, nil
}
