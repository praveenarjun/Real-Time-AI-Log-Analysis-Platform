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
	if r.pool == nil {
		return fmt.Errorf("database pool not initialized")
	}
	// Generate EMP-001 sequential code logic
	var lastCount int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM employees").Scan(&lastCount)
	if err != nil {
		return fmt.Errorf("failed to get employee count: %w", err)
	}
	emp.EmployeeCode = fmt.Sprintf("EMP-%03d", lastCount+1)
	emp.CreatedAt = time.Now()
	emp.UpdatedAt = time.Now()

	query := `INSERT INTO employees (
		id, employee_code, first_name, last_name, email, department_id, hire_date, position, salary, is_active, created_at, updated_at
	) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

	_, err = r.pool.Exec(ctx, query,
		uuid.New(), emp.EmployeeCode, emp.FirstName, emp.LastName, emp.Email, emp.DepartmentID, 
		emp.HireDate, emp.Position, emp.Salary, true, emp.CreatedAt, emp.UpdatedAt,
	)
	return err
}

func (r *WorkforceRepository) RecordAttendance(ctx context.Context, att *models.Attendance) error {
	if r.pool == nil {
		return fmt.Errorf("database pool not initialized")
	}
	query := `INSERT INTO attendance (
		id, employee_id, date, check_in, status, created_at, updated_at
	) VALUES ($1, $2, $3, $4, $5, $6, $7)
	ON CONFLICT (employee_id, date) DO UPDATE SET check_in = EXCLUDED.check_in, updated_at = EXCLUDED.updated_at`

	_, err := r.pool.Exec(ctx, query,
		uuid.New(), att.EmployeeID, att.Date, att.CheckIn, att.Status, time.Now(), time.Now(),
	)
	return err
}

func (r *WorkforceRepository) GetDepartmentHeadcount(ctx context.Context) ([]map[string]interface{}, error) {
	if r.pool == nil {
		return nil, fmt.Errorf("database pool not initialized")
	}
	rows, err := r.pool.Query(ctx, "SELECT department_name, headcount, salary_percentage FROM get_department_headcount()")
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
			"department_name": name,
			"count":           headcount,
			"salary_pct":      percentage,
		})
	}
	return results, nil
}

func (r *WorkforceRepository) ListEmployees(ctx context.Context) ([]models.Employee, error) {
	if r.pool == nil {
		return nil, fmt.Errorf("database pool not initialized")
	}

	query := `
		SELECT 
			e.id, e.employee_code, e.first_name, e.last_name, e.email,
			e.department_id, d.name as department_name, e.position, e.is_active 
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		ORDER BY e.created_at DESC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var employees []models.Employee
	for rows.Next() {
		var e models.Employee
		if err := rows.Scan(
			&e.ID, &e.EmployeeCode, &e.FirstName, &e.LastName, &e.Email,
			&e.DepartmentID, &e.DepartmentName, &e.Position, &e.IsActive,
		); err != nil {
			return nil, err
		}
		employees = append(employees, e)
	}
	return employees, nil
}
