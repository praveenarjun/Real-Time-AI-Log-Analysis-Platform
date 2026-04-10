-- Seed Data for Workforce Management

-- 1. Insert Departments
INSERT INTO departments (name, description) VALUES
('Engineering', 'Software development and infrastructure'),
('HR', 'Human resources and talent management'),
('Marketing', 'Digital marketing and brand strategy'),
('Sales', 'Direct sales and customer relations');

-- 2. Insert Employees (Wait, I need the UUIDs from departments to link them)
-- I will use a CTE to insert departments and then employees in one go or use subqueries.

DO $$
DECLARE
    eng_id UUID;
    hr_id UUID;
BEGIN
    SELECT id INTO eng_id FROM departments WHERE name = 'Engineering';
    SELECT id INTO hr_id FROM departments WHERE name = 'HR';

    -- Insert Engineering Employees
    INSERT INTO employees (employee_code, first_name, last_name, email, hire_date, position, salary, department_id) VALUES
    ('EMP-001', 'John', 'Doe', 'john.doe@example.com', '2023-01-15', 'Senior Engineer', 95000, eng_id),
    ('EMP-002', 'Jane', 'Smith', 'jane.smith@example.com', '2023-03-20', 'Backend Developer', 85000, eng_id);

    -- Insert HR Employees
    INSERT INTO employees (employee_code, first_name, last_name, email, hire_date, position, salary, department_id) VALUES
    ('EMP-003', 'Alice', 'Johnson', 'alice.j@example.com', '2022-11-10', 'HR Manager', 75000, hr_id);
END $$;
