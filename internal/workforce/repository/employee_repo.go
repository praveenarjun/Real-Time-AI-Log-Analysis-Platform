package repository

import (
	"context"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
	"praveenchalla.local/ai-log-analyzer/internal/database"
	"praveenchalla.local/ai-log-analyzer/internal/models"
)

type EmployeeRepository struct {
	db *database.DB
}

func NewEmployeeRepository(db *database.DB) *EmployeeRepository {
	return &EmployeeRepository{db: db}
}

// NewWorkforceRepository is an alias for NewEmployeeRepository but takes a raw pool for legacy support
func NewWorkforceRepository(pool *pgxpool.Pool, l *slog.Logger) *EmployeeRepository {
	return &EmployeeRepository{db: &database.DB{Pool: pool}}
}

func (r *EmployeeRepository) GetAllEmployees(ctx context.Context) ([]models.Employee, error) {
	rows, err := r.db.Pool.Query(ctx, `SELECT id, employee_code, first_name, last_name, email, hire_date, position, salary, department_id, is_active FROM employees`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var employees []models.Employee
	for rows.Next() {
		var e models.Employee
		err := rows.Scan(&e.ID, &e.EmployeeCode, &e.FirstName, &e.LastName, &e.Email, &e.HireDate, &e.Position, &e.Salary, &e.DepartmentID, &e.IsActive)
		if err != nil {
			return nil, err
		}
		employees = append(employees, e)
	}
	return employees, nil
}

func (r *EmployeeRepository) GetAllDepartments(ctx context.Context) ([]models.Department, error) {
	rows, err := r.db.Pool.Query(ctx, `SELECT id, name, description, is_active FROM departments`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var departments []models.Department
	for rows.Next() {
		var d models.Department
		err := rows.Scan(&d.ID, &d.Name, &d.Description, &d.IsActive)
		if err != nil {
			return nil, err
		}
		departments = append(departments, d)
	}
	return departments, nil
}

func (r *EmployeeRepository) GetDepartmentHeadcounts(ctx context.Context) ([]models.DepartmentHeadcount, error) {
	rows, err := r.db.Pool.Query(ctx, `SELECT department_name, headcount, salary_percentage FROM get_department_headcount()`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var headcounts []models.DepartmentHeadcount
	for rows.Next() {
		var h models.DepartmentHeadcount
		err := rows.Scan(&h.DepartmentName, &h.Headcount, &h.SalaryPercentage)
		if err != nil {
			return nil, err
		}
		headcounts = append(headcounts, h)
	}
	return headcounts, nil
}
