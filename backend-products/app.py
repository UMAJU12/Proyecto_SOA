from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app) # Permite que React se comunique con este servicio

# Configuración de Base de Datos
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'), # Se usará vacío si así está en el .env
            database=os.getenv('DB_NAME')
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error de conexión: {err}")
        return None

# --- RUTAS DE LA API ---

@app.route('/')
def index():
    return jsonify({"message": "Microservicio de Productos Activo", "service": "Python/Flask"})

# 1. CONSULTAR TODOS LOS PRODUCTOS (Con filtros opcionales) - HU03
@app.route('/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Error de conexión a la BD"}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    # Query base usando la vista o tabla principal
    # Usamos LEFT JOIN para traer los nombres de categorías, plataformas y géneros
    query = """
        SELECT p.*, c.name as category_name, pl.name as platform_name, g.name as genre_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN platforms pl ON p.platform_id = pl.id
        LEFT JOIN genres g ON p.genre_id = g.id
        WHERE p.is_active = 1
    """
    
    # Aquí se podrían agregar filtros por categoría o nombre si vienen en request.args
    # Ejemplo: ?category_id=1
    
    cursor.execute(query)
    products = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify(products)

# 2. CONSULTAR UN PRODUCTO POR ID
@app.route('/products/<int:id>', methods=['GET'])
def get_product(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = "SELECT * FROM products WHERE id = %s AND is_active = 1"
    cursor.execute(query, (id,))
    product = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if product:
        return jsonify(product)
    else:
        return jsonify({"message": "Producto no encontrado"}), 404

# 3. REGISTRAR UN NUEVO PRODUCTO - HU02
@app.route('/products', methods=['POST'])
def create_product():
    data = request.json
    
    # Validación básica de campos obligatorios según PDF
    required_fields = ['name', 'price', 'stock', 'category_id', 'product_type']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"El campo {field} es obligatorio"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        INSERT INTO products 
        (name, description, price, stock, category_id, platform_id, genre_id, product_type, image_url, release_date, rating)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    values = (
        data['name'],
        data.get('description', ''),
        data['price'],
        data['stock'],
        data['category_id'],
        data.get('platform_id'), # Puede ser None (NULL en BD)
        data.get('genre_id'),    # Puede ser None
        data['product_type'],
        data.get('image_url', ''),
        data.get('release_date'),
        data.get('rating')
    )
    
    try:
        cursor.execute(query, values)
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({"message": "Producto creado exitosamente", "id": new_id}), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# 4. EDITAR PRODUCTO - HU04
@app.route('/products/<int:id>', methods=['PUT'])
def update_product(id):
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Construir query dinámicamente según los campos que vengan
    fields = []
    values = []
    
    posible_fields = ['name', 'description', 'price', 'stock', 'category_id', 'platform_id', 'genre_id', 'product_type', 'image_url', 'rating']
    
    for field in posible_fields:
        if field in data:
            fields.append(f"{field} = %s")
            values.append(data[field])
            
    if not fields:
        return jsonify({"message": "No se enviaron datos para actualizar"}), 400
        
    values.append(id) # Para el WHERE
    query = f"UPDATE products SET {', '.join(fields)} WHERE id = %s"
    
    try:
        cursor.execute(query, tuple(values))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Producto actualizado correctamente"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# 5. ELIMINAR PRODUCTO (Soft Delete) - HU05
# En lugar de borrar el registro, lo marcamos como inactivo (is_active = 0) 
# para mantener la integridad referencial con las ventas históricas.
@app.route('/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar si existe primero
        cursor.execute("SELECT id FROM products WHERE id = %s", (id,))
        if not cursor.fetchone():
             return jsonify({"message": "Producto no encontrado"}), 404

        # Realizar el borrado lógico
        query = "UPDATE products SET is_active = 0 WHERE id = %s"
        cursor.execute(query, (id,))
        conn.commit()
        
        cursor.close()
        conn.close()
        return jsonify({"message": "Producto eliminado (desactivado) correctamente"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# Endpoint auxiliar para obtener categorías (útil para llenar selects en el Frontend)
@app.route('/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM categories")
    result = cursor.fetchall()
    conn.close()
    return jsonify(result)

# 6. ACTUALIZAR STOCK (Para cuando se realiza una venta) - HU09
@app.route('/products/<int:id>/stock', methods=['PUT'])
def update_stock(id):
    data = request.json
    quantity = data.get('quantity', 0)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Verificar stock actual
    cursor.execute("SELECT stock FROM products WHERE id = %s", (id,))
    result = cursor.fetchone()
    
    if not result:
        return jsonify({"error": "Producto no encontrado"}), 404
        
    current_stock = result[0] # Al usar cursor normal es tupla, si usas dictionary=True cambia esto
    
    # Nota: Si en tu app.py usas dictionary=True en el cursor, sería result['stock']
    # Como en las otras funciones usaste dictionary=True o no según el caso, 
    # aseguremos usar diccionario para consistencia:
    
    cursor.close()
    
    # Re-abrimos con diccionario para no fallar
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT stock FROM products WHERE id = %s", (id,))
    product = cursor.fetchone()
    
    if product['stock'] < quantity:
        return jsonify({"error": "Stock insuficiente"}), 400
        
    # 2. Restar stock
    new_stock = product['stock'] - quantity
    cursor.execute("UPDATE products SET stock = %s WHERE id = %s", (new_stock, id))
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Stock actualizado", "new_stock": new_stock})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, port=port)