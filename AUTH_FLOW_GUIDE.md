# Signup and Login Guide (All Roles)

This document explains how each user role can sign up and log in with the current backend configuration.

## Base URL

- Backend API: `http://localhost:2426`

## Roles Covered

- Admin
- Patient
- Doctor
- Compounder
- Receptionist
- AmbulanceDriver

## Important Current Rules

- Public signup is available for:
  - `Admin`
  - `Patient`
- Admin-authenticated signup is required for:
  - `Doctor`
  - `Compounder`
  - `Receptionist`
  - `AmbulanceDriver`
- For admin-protected registration routes, frontend must send:
  - `Authorization: <admin_jwt_token>`
  - `Region: <north|south|east|west>`

---

## 1) Admin

### Signup

- Endpoint: `POST /hospitalAdmin/registerHospitalAdmin`
- Public: Yes
- Required body:
  - `full_name`
  - `email`
  - `contact_number`
  - `region`
  - `password`
  - `user_type` (typically `Admin`)

### Login

- Endpoint: `POST /hospitalAdmin/adminLogin`
- Body:
  - `email`
  - `password`
  - `region`
- Returns JWT token and region.

### OTP Verification

- Endpoint: `POST /hospitalAdmin/adminOtp`
- Headers:
  - `Authorization: <admin_jwt_token>`
  - `Region: <region>`
- Body:
  - `email`
  - `otp`

---

## 2) Patient

### Signup

- Endpoint: `POST /register`
- Public: Yes
- Required body (as used by current frontend):
  - `Full_Name`
  - `Email`
  - `ContactNumber`
  - `Password`
  - `region`
  - `User_type` (`Patient`)

### Login

- Endpoint: `POST /login`
- Body:
  - `email`
  - `password`
  - `region` (frontend sends this)

### OTP Verification

- Endpoint: `POST /verify-otp`
- Headers:
  - `Region: <region>`
- Body:
  - `email`
  - `otp`

---

## 3) Doctor

### Signup

- Endpoint: `POST /hospitalAdmin/Registerdoctor`
- Public: No (Admin token required)
- Headers:
  - `Authorization: <admin_jwt_token>`
  - `Region: <region>`
- Required body:
  - `full_name`
  - `email`
  - `contact_number`
  - `description`
  - `department`

### Login

- Endpoint: `POST /doctor/doctorLogin`
- Body:
  - `email`
  - `password`
  - `region`

### OTP Verification

- Current status: backend doctor OTP route is not enabled yet in routes.
- Note: login exists, but dedicated doctor OTP endpoint is currently marked TODO in backend routes.

---

## 4) Compounder

### Signup

- Endpoint: `POST /hospitalAdmin/registerStaff`
- Public: No (Admin token required)
- Headers:
  - `Authorization: <admin_jwt_token>`
  - `Region: <region>`
- Required body:
  - `full_name`
  - `email`
  - `contact_number`
  - `position` = `Compounder`

### Login

- Endpoint: `POST /compounder/staffLogin`
- Body:
  - `email`
  - `password`
  - `region`

### OTP Verification

- Endpoint: `POST /compounder/staffOtp`
- Headers:
  - `Authorization: <staff_jwt_token>`
  - `Region: <region>`
- Body:
  - `email`
  - `otp`

---

## 5) Receptionist

### Signup

- Endpoint: `POST /hospitalAdmin/registerStaff`
- Public: No (Admin token required)
- Headers:
  - `Authorization: <admin_jwt_token>`
  - `Region: <region>`
- Required body:
  - `full_name`
  - `email`
  - `contact_number`
  - `position` = `Reception`

### Login

- Endpoint: `POST /receptionist/staffLogin`
- Body:
  - `email`
  - `password`
  - `region`

### OTP Verification

- Endpoint: `POST /receptionist/staffOtp`
- Headers:
  - `Authorization: <staff_jwt_token>`
  - `Region: <region>`
- Body:
  - `email`
  - `otp`

---

## 6) AmbulanceDriver

### Signup

- Endpoint: `POST /hospitalAdmin/registerAmbulanceDriver`
- Public: No (Admin token required)
- Headers:
  - `Authorization: <admin_jwt_token>`
  - `Region: <region>`
- Required body:
  - `full_name`
  - `email`
  - `vehicle_no`
  - `password`

### Login

- Endpoint: `POST /ambulanceDriver/login`
- Body:
  - `email`
  - `password`
  - `region`
- Returns driver token and `driver_id` (used by dashboard).

### OTP Verification

- Current status: no ambulance-driver OTP verification route in current frontend OTP map.

---

## Frontend Notes

- Signup page: `frontend/src/pages/Register.jsx`
  - Now role-based and aligned with backend-allowed configuration.
- Login page: `frontend/src/pages/Login.jsx`
  - Role-based endpoint mapping.
- OTP page: `frontend/src/pages/LoginOtpPage.jsx`
  - Supports OTP for Admin, Compounder, Receptionist, and Patient.

