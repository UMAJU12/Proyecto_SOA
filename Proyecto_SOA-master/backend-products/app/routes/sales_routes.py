from flask import Blueprint
from app.controllers.sales_controller import create_sale, get_sales_history, get_sale_details

sales_bp = Blueprint('sales', __name__, url_prefix='/api/sales')

# Crear venta
sales_bp.route('/', methods=['POST'])(create_sale)

# 🔥 Nueva HU10
sales_bp.route('/history', methods=['GET'])(get_sales_history)
sales_bp.route('/history/<int:sale_id>', methods=['GET'])(get_sale_details)
