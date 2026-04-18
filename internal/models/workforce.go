package models

import (
	"time"
	"github.com/google/uuid"
)

// Department represents the departments table
type Department struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	ManagerID   uuid.UUID `json:"manager_id"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Employee represents the employees table
type Employee struct {
	ID           uuid.UUID `json:"id"`
	EmployeeCode string    `json:"employee_code"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	DateOfBirth  time.Time `json:"date_of_birth"`
	Gender       string    `json:"gender"`
	DepartmentID uuid.UUID `json:"department_id"`
	ManagerID    uuid.UUID `json:"manager_id"`
	HireDate     time.Time `json:"hire_date"`
	Position     string    `json:"position"`
	Salary       float64   `json:"salary"`
	Address        string    `json:"address"`
	IsActive       bool      `json:"is_active"`
	DepartmentName string    `json:"department_name"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// User represents the users table
type User struct {
	ID                 uuid.UUID `json:"id"`
	Username           string    `json:"username"`
	Email              string    `json:"email"`
	PasswordHash       string    `json:"-"`
	Role               string    `json:"role"`
	EmployeeID         uuid.UUID `json:"employee_id"`
	RefreshToken       string    `json:"-"`
	RefreshTokenExpiry time.Time `json:"-"`
	CreatedAt          time.Time `json:"created_at"`
}

// Attendance represents the attendance table
type Attendance struct {
	ID         uuid.UUID `json:"id"`
	EmployeeID uuid.UUID `json:"employee_id"`
	Date       time.Time `json:"date"`
	CheckIn    time.Time `json:"check_in"`
	CheckOut   time.Time `json:"check_out"`
	Status     string    `json:"status"`
	Notes      string    `json:"notes"`
	WorkHours  float64   `json:"work_hours"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// LeaveRequest represents the leave_requests table
type LeaveRequest struct {
	ID             uuid.UUID `json:"id"`
	EmployeeID     uuid.UUID `json:"employee_id"`
	LeaveType      string    `json:"leave_type"`
	StartDate      time.Time `json:"start_date"`
	EndDate        time.Time `json:"end_date"`
	TotalDays      int       `json:"total_days"`
	Reason         string    `json:"reason"`
	Status         string    `json:"status"`
	ApprovedByID   uuid.UUID `json:"approved_by_id"`
	ApprovedDate   time.Time `json:"approved_date"`
	Comments       string    `json:"comments"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// DepartmentHeadcount represents the result of the get_department_headcount function
type DepartmentHeadcount struct {
	DepartmentName   string  `json:"department_name"`
	Headcount        int64   `json:"headcount"`
	SalaryPercentage float64 `json:"salary_percentage"`
}
