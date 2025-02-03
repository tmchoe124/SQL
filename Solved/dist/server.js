import inquirer from "inquirer";
import { pool, connectToDb } from "./connection.js";
await connectToDb();
async function mainMenu() {
    const { action } = await inquirer.prompt([
        {
            type: "list",
            name: "action",
            message: "What would you like to do?",
            choices: [
                "View All Employees",
                "Add Employee",
                "Update Employee Role",
                "View All Roles",
                "Add Role",
                "View All Departments",
                "Add Department",
                "Exit",
            ],
        },
    ]);
    switch (action) {
        case "View All Employees":
            await viewEmployees();
            break;
        case "Add Employee":
            await addEmployee();
            break;
        case "Update Employee Role":
            await updateEmployeeRole();
            break;
        case "View All Roles":
            await viewRoles();
            break;
        case "Add Role":
            await addRole();
            break;
        case "View All Departments":
            await viewDepartments();
            break;
        case "Add Department":
            await addDepartment();
            break;
        case "Exit":
            process.exit();
    }
    mainMenu();
}
async function viewEmployees() {
    const { rows } = await pool.query(`SELECT employees.id, employees.first_name, employees.last_name, role.title, departments.name AS department, role.salary, CONCAT(managers.first_name, ' ', managers.last_name) AS manager
     FROM employees
     LEFT JOIN role ON employees.role_id = role.id
     LEFT JOIN departments ON role.department_id = departments.id
     LEFT JOIN employees managers ON employees.manager_id = managers.id`);
    console.table(rows);
}
async function addEmployee() {
    const { rows: employee } = await pool.query("Select id, first_name, last_name FROM employees");
    const managerChoices = [
        { name: "None", value: null },
        ...employee.map((employee) => ({
            name: `${employee.first_name} ${employee.last_name}`,
            value: employee.id,
        })),
    ];
    const { first_name, last_name, role_id, manager_id } = await inquirer.prompt([
        {
            type: "input",
            name: "first_name",
            message: "What is the employee's first name?",
        },
        {
            type: "input",
            name: "last_name",
            message: "What is the employee's last name?",
        },
        {
            type: "input",
            name: "role_id",
            message: "What is the employee's role?",
        },
        {
            type: "list",
            name: "manager_id",
            message: "Who is the employee's manager?",
            choices: managerChoices,
        },
    ]);
    await pool.query("INSERT INTO employees(first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)", [first_name, last_name, role_id, manager_id]);
}
async function updateEmployeeRole() {
    const employeeQuery = await pool.query("SELECT id, first_name, last_name FROM employees");
    const roleQuery = await pool.query("SELECT id, title FROM role");
    const employeeChoices = employeeQuery.rows.map((employee) => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id,
    }));
    const roleChoices = roleQuery.rows.map((role) => ({
        name: role.title,
        value: role.id,
    }));
    const { employee_id, role_id } = await inquirer.prompt([
        {
            type: "list",
            name: "employee_id",
            message: "Which employee's role would you like to update?",
            choices: employeeChoices,
        },
        {
            type: "list",
            name: "role_id",
            message: "Which role would you like to assign the selected employee?",
            choices: roleChoices,
        },
    ]);
    await pool.query("UPDATE employees SET role_id = $1 WHERE id = $2", [
        role_id,
        employee_id,
    ]);
}
async function viewRoles() {
    const { rows } = await pool.query(`SELECT role.id, role.title, role.salary, departments.name AS department
        FROM role
        LEFT JOIN departments ON role.department_id = departments.id`);
    console.table(rows);
}
async function addRole() {
    const { rows: department } = await pool.query("SELECT id, name FROM departments");
    const departmentChoices = department.map((department) => ({
        name: department.name,
        value: department.id,
    }));
    const { title, salary, department_id } = await inquirer.prompt([
        {
            type: "input",
            name: "title",
            message: "What is the name of the role?",
        },
        {
            type: "input",
            name: "salary",
            message: "What is the salary of the role?",
        },
        {
            type: "list",
            name: "department_id",
            message: "Which department does the role belong to?",
            choices: departmentChoices,
        },
    ]);
    await pool.query("INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)", [title, salary, department_id]);
}
async function viewDepartments() {
    const { rows } = await pool.query("SELECT * FROM departments");
    console.table(rows);
}
async function addDepartment() {
    const { name } = await inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "What is the name of the department?",
        },
    ]);
    await pool.query("INSERT INTO departments (name) VALUES ($1)", [name]);
    console.log("Added Service to the Database");
}
mainMenu();
