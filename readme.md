# Vehicle Rental System - API Documentation

This repository implements a backend API for a Vehicle Rental System using Node.js, TypeScript, Express and PostgreSQL. The API follows a modular structure with feature-based modules: `auth`, `users`, `vehicles`, and `bookings`.

**Run**:

- Install dependencies: `npm install`
- Start in development mode (uses `tsx`):

```
npm run dev
```

Environment:

- The app reads DB connection and JWT secret from `src/config/index.ts` and `.env`. Ensure `DATABASE_URL` or equivalent `connectionString` and `JWT_SECRET` (or `jwtSecret` in config) are set.

**Base URL**: `/api/v1`

**Common Response Shape**

- Success:

```
{
	"success": true,
	"message": "Operation description",
	"data": {...}
}
```

- Error:

```
{
	"success": false,
	"message": "Error description",
	"errors": ...
}
```

**Authentication Header**

- Protected endpoints require: `Authorization: Bearer <token>`

--

**Endpoints**

**Auth**

- **POST /api/v1/auth/signup** : Register a new user (Public)

  - Request body (JSON):
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "securePassword123",
      "phone": "01712345678",
      "role": "customer"
    }
    ```
  - Success (201 Created):
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "01712345678",
        "role": "customer"
      }
    }
    ```
  - Notes: Passwords are hashed before storing. Email and phone must be unique; emails are stored lowercased. Minimum password length is 6.

- **POST /api/v1/auth/signin** : Login and receive JWT (Public)
  - Request body:
    ```json
    { "email": "john.doe@example.com", "password": "securePassword123" }
    ```
  - Success (200 OK):
    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "token": "<jwt_token>",
        "user": {
          "id": 1,
          "name": "John Doe",
          "email": "john.doe@example.com",
          "phone": "01712345678",
          "role": "customer"
        }
      }
    }
    ```

--

**Vehicles**

- **POST /api/v1/vehicles** : Create vehicle (Admin only)

  - Headers: `Authorization: Bearer <jwt>`
  - Request body:
    ```json
    {
      "vehicle_name": "Toyota Camry 2024",
      "type": "car",
      "registration_number": "ABC-1234",
      "daily_rent_price": 50,
      "availability_status": "available"
    }
    ```
  - Success (201 Created): returns created vehicle object.
  - Validation:
    - `type` must be one of `car`, `bike`, `van`, `SUV`.
    - `daily_rent_price` must be a positive number.
    - `vehicle_name` and `registration_number` are required.

- **GET /api/v1/vehicles** : List all vehicles (Public)

  - Success (200 OK): returns `data` array of vehicles. If no vehicles, `data` is an empty array and message is "No vehicles found".

- **GET /api/v1/vehicles/:vehicleId** : Get vehicle by id (Public)

  - Success (200 OK): returns vehicle object.
  - Not found: 404 with `message: "Vehicle not found"`.

- **PUT /api/v1/vehicles/:vehicleId** : Update vehicle (Admin only)

  - Headers: `Authorization: Bearer <jwt>`
  - Request body: any of the vehicle fields (all optional).
  - Validation same as create; invalid input returns 400.
  - Success (200 OK): returns updated vehicle.

- **DELETE /api/v1/vehicles/:vehicleId** : Delete vehicle (Admin only)
  - Headers: `Authorization: Bearer <jwt>`
  - Constraint: cannot delete if there are active bookings for this vehicle (returns 409).
  - Success (200 OK): returns success message.

--

**Users**

- **GET /api/v1/users** : Get all users (Admin only)

  - Headers: `Authorization: Bearer <jwt>`
  - Success (200 OK): returns array of users (id, name, email, phone, role).

- **PUT /api/v1/users/:userId** : Update user (Admin or owner)

  - Headers: `Authorization: Bearer <jwt>`
  - Admin may update any user's role/details. Customer may update own profile only.
  - If updating `email`, it will be stored lowercased.
  - If updating `password`, it will be hashed before storing.
  - Success (200 OK): returns updated user.

- **DELETE /api/v1/users/:userId** : Delete user (Admin only)
  - Headers: `Authorization: Bearer <jwt>`
  - Constraint: cannot delete if user has active bookings (returns 409).
  - Success (200 OK): returns success message.

--

**Bookings**

- **POST /api/v1/bookings** : Create booking (Customer or Admin)

  - Headers: `Authorization: Bearer <jwt>`
  - Request body:
    ```json
    {
      "customer_id": 1,
      "vehicle_id": 2,
      "rent_start_date": "2024-01-15",
      "rent_end_date": "2024-01-20"
    }
    ```
  - Behavior:
    - Validates `customer_id` exists.
    - Validates vehicle exists and `availability_status` is `available`.
    - Validates `rent_end_date` is after `rent_start_date` and computes `number_of_days` as full days difference.
    - Calculates `total_price = daily_rent_price * number_of_days`.
    - Creates booking with status `active` and updates vehicle `availability_status` to `booked`.
  - Success (201 Created): returns booking object with embedded `vehicle` info (vehicle name and daily price).

- **GET /api/v1/bookings** : List bookings (Role-based)

  - Headers: `Authorization: Bearer <jwt>`
  - Admin: returns all bookings with nested `customer` and `vehicle` objects.
  - Customer: returns own bookings with nested `vehicle` object.
  - Success (200 OK).

- **PUT /api/v1/bookings/:bookingId** : Update booking status (Role-based)
  - Headers: `Authorization: Bearer <jwt>`
  - Body for cancellation: `{ "status": "cancelled" }` (Customer or Admin)
    - Customer can cancel only for their own booking and only before the start date.
    - Cancelling updates booking `status` to `cancelled` and sets vehicle `availability_status` to `available`.
  - Body for return: `{ "status": "returned" }` (Admin only)
    - Admin can mark active bookings as `returned`. This updates booking `status` and vehicle `availability_status` to `available`.
  - Success (200 OK): returns updated booking. Errors return 400/403/404 as appropriate.

Auto-Return

- The server runs a background sweep (hourly) that marks bookings as `returned` if `rent_end_date` has passed, and frees the vehicles accordingly.

--

Database

- Implemented in `src/config/db.ts`. Key tables:
  - `users` (id, name, email, password, phone, role)
  - `vehicles` (id, vehicle_name, type, registration_number, daily_rent_price, availability_status)
  - `bookings` (id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)

Constraints enforced:

- `users`: unique lowercased email index; unique phone.
- `vehicles`: `registration_number` unique; `type` enum.
- `bookings`: `CONSTRAINT check_end_after_start CHECK (rent_end_date > rent_start_date)` and `CONSTRAINT check_positive_price CHECK (total_price > 0)`.

--

Notes & Recommendations

- Consider adding request validation middleware (e.g., `express-validator` or `zod`) to move validation logic out of services and provide consistent error payloads.
- For production scheduling, use a dedicated job runner or external scheduler rather than `setInterval`.

--

## Example Requests (curl)

**Auth: Signup**

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "phone": "01712345678",
    "role": "customer"
  }'
```

**Auth: Signin**

```bash
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }'
```

**Vehicles: Create** (requires admin token)

```bash
curl -X POST http://localhost:3000/api/v1/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "vehicle_name": "Toyota Camry 2024",
    "type": "car",
    "registration_number": "ABC-1234",
    "daily_rent_price": 50,
    "availability_status": "available"
  }'
```

**Vehicles: List All** (public)

```bash
curl -X GET http://localhost:3000/api/v1/vehicles
```

**Vehicles: Get by ID** (public)

```bash
curl -X GET http://localhost:3000/api/v1/vehicles/1
```

**Vehicles: Update** (requires admin token)

```bash
curl -X PUT http://localhost:3000/api/v1/vehicles/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "daily_rent_price": 60
  }'
```

**Vehicles: Delete** (requires admin token)

```bash
curl -X DELETE http://localhost:3000/api/v1/vehicles/1 \
  -H "Authorization: Bearer <jwt_token>"
```

**Users: List All** (requires admin token)

```bash
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <jwt_token>"
```

**Users: Update** (admin or owner)

```bash
curl -X PUT http://localhost:3000/api/v1/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "name": "John Doe Updated",
    "phone": "+1234567899"
  }'
```

**Users: Delete** (requires admin token)

```bash
curl -X DELETE http://localhost:3000/api/v1/users/1 \
  -H "Authorization: Bearer <jwt_token>"
```

**Bookings: Create** (customer or admin)

```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "customer_id": 1,
    "vehicle_id": 1,
    "rent_start_date": "2024-01-15",
    "rent_end_date": "2024-01-20"
  }'
```

**Bookings: List** (admin sees all, customer sees own)

```bash
curl -X GET http://localhost:3000/api/v1/bookings \
  -H "Authorization: Bearer <jwt_token>"
```

**Bookings: Cancel** (customer before start date or admin)

```bash
curl -X PUT http://localhost:3000/api/v1/bookings/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "status": "cancelled"
  }'
```

**Bookings: Mark as Returned** (admin only)

```bash
curl -X PUT http://localhost:5000/api/v1/bookings/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "status": "returned"
  }'
```

