# app/controllers/sales_controller.py
from flask import request, jsonify
from decimal import Decimal
from app.config.database import db
from mysql.connector import Error

def create_sale():
    try:
        data = request.get_json()
        items = data.get('items')

        if not items or len(items) == 0:
            return jsonify({'success': False, 'message': 'Debe incluir productos en la venta'}), 400

        seller_name = data.get('seller_name')
        seller_identifier = data.get('seller_identifier')
        customer_name = data.get('customer_name')
        customer_email = data.get('customer_email')
        payment_method = data.get('payment_method', 'efectivo')

        connection = db.get_connection()
        cursor = connection.cursor(dictionary=True)

        total_amount = Decimal('0.00')
        products_data = {}

        for item in items:
            product_id = item.get('product_id')
            quantity = item.get('quantity')

            cursor.execute("SELECT id, name, price, stock FROM products WHERE id = %s", (product_id,))
            product = cursor.fetchone()

            if not product:
                return jsonify({'success': False, 'message': f'Producto {product_id} no encontrado'}), 404

            if product['stock'] < quantity:
                return jsonify({
                    'success': False,
                    'message': f"Stock insuficiente para {product['name']}. Disponible: {product['stock']}, solicitado: {quantity}"
                }), 400

            unit_price = Decimal(str(product['price']))
            subtotal = unit_price * quantity
            total_amount += subtotal

            products_data[product_id] = {
                "name": product["name"],
                "unit_price": unit_price,
                "quantity": quantity,
                "subtotal": subtotal
            }

        cursor.execute("""
            INSERT INTO sales 
            (seller_name, seller_identifier, customer_name, customer_email, total_amount, payment_method)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (seller_name, seller_identifier, customer_name, customer_email, float(total_amount), payment_method))

        sale_id = cursor.lastrowid

        for pid, info in products_data.items():
            cursor.execute("""
                INSERT INTO sale_items 
                (sale_id, product_id, product_name, unit_price, quantity, subtotal)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                sale_id, pid, info["name"], float(info["unit_price"]), info["quantity"], float(info["subtotal"])
            ))

            cursor.execute("""
                UPDATE products SET stock = stock - %s WHERE id = %s
            """, (info["quantity"], pid))

        connection.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "message": "Venta registrada con éxito",
            "sale_id": sale_id,
            "total": float(total_amount)
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
def get_sales_history():
    seller_identifier = request.args.get("seller_identifier")  # filtrado por vendedor opcional

    connection = db.get_connection()
    cursor = connection.cursor(dictionary=True)

    query = """
        SELECT id, seller_name, seller_identifier, customer_name, total_amount, payment_method, created_at
        FROM sales
        WHERE 1 = 1
    """
    params = []

    # FILTROS OPCIONALES 🔥
    if seller_identifier:
        query += " AND seller_identifier = %s"
        params.append(seller_identifier)

    start = request.args.get("start_date")
    end   = request.args.get("end_date")
    client = request.args.get("customer_name")

    if start:
        query += " AND DATE(created_at) >= %s"
        params.append(start)

    if end:
        query += " AND DATE(created_at) <= %s"
        params.append(end)

    if client:
        query += " AND customer_name LIKE %s"
        params.append(f"%{client}%")

    query += " ORDER BY created_at DESC"   # ⬅ ordenado del más reciente al más viejo

    cursor.execute(query, params)
    sales = cursor.fetchall()
    cursor.close()

    return jsonify({"success": True, "sales": sales}), 200


# ────────────────────────────────────────────────
#  🔥 DETALLE DE UNA VENTA
# ────────────────────────────────────────────────

def get_sale_details(sale_id):
    connection = db.get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, seller_name, seller_identifier, customer_name, customer_email,
               total_amount, payment_method, created_at
        FROM sales
        WHERE id = %s
    """, (sale_id,))
    sale = cursor.fetchone()

    if not sale:
        return jsonify({"success": False, "message": "Venta no encontrada"}), 404

    cursor.execute("""
        SELECT product_id, product_name, unit_price, quantity, subtotal
        FROM sale_items
        WHERE sale_id = %s
    """, (sale_id,))
    sale["items"] = cursor.fetchall()
    cursor.close()

    return jsonify({"success": True, "sale": sale}), 200
