# Products API Endpoints

This NestJS application provides a REST API for managing products using the DummyJSON API as a backend.

## Base URL
```
http://localhost:3000
```

## Available Endpoints

### 1. GET All Products
**Endpoint:** `GET /products`

**Description:** Fetches all products from the DummyJSON API.

**Example:**
```bash
curl -X GET http://localhost:3000/products
```

**Response:**
```json
{
  "products": [...],
  "total": 194,
  "skip": 0,
  "limit": 30
}
```

### 2. GET Product by ID
**Endpoint:** `GET /products/:id`

**Description:** Fetches a specific product by its ID.

**Example:**
```bash
curl -X GET http://localhost:3000/products/1
```

**Response:**
```json
{
  "id": 1,
  "title": "Essence Mascara Lash Princess",
  "description": "The Essence Mascara Lash Princess is a popular mascara known for its volumizing and lengthening effects...",
  "category": "beauty",
  "price": 9.99,
  ...
}
```

### 3. POST Create Product
**Endpoint:** `POST /products`

**Description:** Creates a new product.

**Example:**
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Product",
    "description": "A new product description",
    "category": "electronics",
    "price": 299.99,
    "stock": 50,
    "sku": "NP001",
    "weight": 2.5,
    "dimensions": {
      "width": 10,
      "height": 5,
      "depth": 2
    }
  }'
```

**Response:**
```json
{
  "id": 195,
  "title": "New Product",
  "description": "A new product description",
  ...
}
```

### 4. PUT Update Product
**Endpoint:** `PUT /products/:id`

**Description:** Updates an existing product.

**Example:**
```bash
curl -X PUT http://localhost:3000/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Product Title",
    "price": 19.99
  }'
```

### 5. DELETE Product
**Endpoint:** `DELETE /products/:id`

**Description:** Deletes a product by its ID.

**Example:**
```bash
curl -X DELETE http://localhost:3000/products/1
```

**Response:**
```json
{
  "isDeleted": true,
  "deletedProduct": {
    "id": 1,
    "title": "Essence Mascara Lash Princess",
    ...
  }
}
```

### 6. GET Search Products
**Endpoint:** `GET /products/search?q={query}`

**Description:** Searches for products based on a query string.

**Example:**
```bash
curl -X GET "http://localhost:3000/products/search?q=phone"
```

**Response:**
```json
{
  "products": [...],
  "total": 4,
  "skip": 0,
  "limit": 30
}
```

## Error Handling

The API includes proper error handling:
- **404 Not Found**: When a product with the specified ID doesn't exist
- **500 Internal Server Error**: When there's an issue with the external API or server

## Testing with Postman or Thunder Client

You can import these endpoints into Postman or use the Thunder Client extension in VS Code to test the API endpoints interactively.

## Notes

- This application acts as a proxy to the DummyJSON API
- The DummyJSON API is a mock API, so some operations (like POST, PUT, DELETE) don't actually persist data
- All operations return the expected response format as if they were successful