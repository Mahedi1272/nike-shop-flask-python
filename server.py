import os
import sys
import shutil
import importlib.util
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# =================== DYNAMICALLY LOAD ORIGINAL BACKEND ===================
# Instead of importing "NIKE SHOPE.PY" (which would block the server by executing main()), 
# we read the file text, remove the main() function call line, and execute the variables 
# inside a local namespace. This leaves your script 100% untouched and unchanged!
backend_file = "NIKE SHOPE.PY"

if not os.path.exists(backend_file):
    print(f"Error: Could not find '{backend_file}' in the current directory.")
    sys.exit(1)

print(f"[INIT] Dynamically loading backend data from '{backend_file}'...")
try:
    with open(backend_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Exclude the lines that run the main program so it doesn't block
    filtered_lines = []
    for line in lines:
        if line.strip().startswith("main()"):
            continue
        filtered_lines.append(line)
        
    code_without_main = "".join(filtered_lines)
    
    # Run the python code inside a custom namespace
    namespace = {}
    exec(code_without_main, namespace)
    
    # Extract data variables
    shoes = namespace["shoes"]
    discount_percent = namespace["discount_percent"]
    discount_limit = namespace["discount_limit"]
    bag_price = namespace["bag_price"]
    
except Exception as e:
    print(f"[ERROR] Failed to load data from '{backend_file}': {e}")
    sys.exit(1)

# =================== FLASK SERVER SETUP ===================
app = Flask(__name__, static_folder='static')
CORS(app)

def get_shoe_image_path(category, shoe_id, name):
    name_lower = name.lower()
    if "air max" in name_lower:
        return "/static/images/nike_air_max.png"
    elif "jordan" in name_lower:
        return "/static/images/nike_jordan.png"
    elif "pegasus" in name_lower:
        return "/static/images/nike_pegasus.png"
    elif "dunk" in name_lower:
        return "/static/images/nike_dunk.png"
    else:
        images = [
            "/static/images/nike_air_max.png",
            "/static/images/nike_jordan.png",
            "/static/images/nike_pegasus.png",
            "/static/images/nike_dunk.png"
        ]
        return images[shoe_id % len(images)]

def get_shoe_rating(category, shoe_id):
    return round(4.1 + ((shoe_id * 7) % 9) * 0.1, 1)

# =================== API ROUTING ===================
@app.route('/api/products', methods=['GET'])
def get_products():
    product_list = []
    for cat, items in shoes.items():
        for s_id, details in items.items():
            product_list.append({
                "id": s_id,
                "category": cat,
                "name": details["name"],
                "price": details["price"],
                "stock": details["stock"],
                "image": get_shoe_image_path(cat, s_id, details["name"]),
                "rating": get_shoe_rating(cat, s_id)
            })
    return jsonify(product_list)

@app.route('/api/buy', methods=['POST'])
def api_buy():
    data = request.get_json() or {}
    category = data.get("category")
    shoe_id = data.get("id")
    qty = data.get("qty", 1)
    carry_bag = data.get("carry_bag", False)
    payment_mode = data.get("payment_mode", "Online")
    customer_name = data.get("customer_name", "Anonymous")
    customer_email = data.get("customer_email", "N/A")
    shipping_address = data.get("shipping_address", "N/A")

    if not category or not shoe_id:
        return jsonify({"success": False, "message": "Missing category or shoe ID"}), 400

    try:
        shoe_id = int(shoe_id)
        qty = int(qty)
    except ValueError:
        return jsonify({"success": False, "message": "Invalid ID or quantity format"}), 400

    if category not in shoes or shoe_id not in shoes[category]:
        return jsonify({"success": False, "message": "Invalid Shoe ID or Category"}), 400

    shoe = shoes[category][shoe_id]
    if qty <= 0:
        return jsonify({"success": False, "message": "Quantity must be greater than 0"}), 400

    if qty > shoe["stock"]:
        return jsonify({"success": False, "message": f"❌ Stock kam hai! Available stock: {shoe['stock']}. Try less quantity."}), 400

    price = shoe["price"]
    total = price * qty
    discount = (total * discount_percent) / 100 if total >= discount_limit else 0
    subtotal = total - discount
    bag_charge = qty * bag_price if carry_bag else 0
    final_amount = subtotal + bag_charge

    # Deduct stock
    shoe["stock"] -= qty

    # Log order into bill file (matching CLI game behavior)
    try:
        # Save Bill to File matching CLI formatting
        with open("nikeshope.txt", "a", encoding="utf-8") as f:
            f.write("\n========== NIKE SHOP BILL ==========\n")
            f.write(f"Customer Name: {customer_name}\n")
            f.write(f"Email        : {customer_email}\n")
            f.write(f"Address      : {shipping_address}\n")
            f.write(f"Category     : {category.title()}\n")
            f.write(f"Shoe Name    : {shoe['name']}\n")
            f.write(f"Price        : ${price}\n")
            f.write(f"Quantity     : {qty}\n")
            f.write(f"Total        : ${total}\n")
            f.write(f"Discount     : ${discount}\n")
            f.write(f"Bag Charge   : ${bag_charge}\n")
            f.write(f"Payable Amt  : ${final_amount}\n")
            f.write(f"Payment      : {payment_mode}\n")
            f.write("===================================\n")
    except Exception as e:
        print(f"[ERROR] Could not log purchase to file: {e}")

    return jsonify({
        "success": True,
        "message": "Order placed successfully!",
        "bill": {
            "customer_name": customer_name,
            "customer_email": customer_email,
            "shipping_address": shipping_address,
            "category": category.title(),
            "name": shoe["name"],
            "price": price,
            "qty": qty,
            "total": total,
            "discount": discount,
            "bag_charge": bag_charge,
            "final_amount": final_amount,
            "payment_mode": payment_mode
        },
        "new_stock": shoe["stock"]
    })

@app.route('/api/admin/stock', methods=['POST'])
def api_add_stock():
    data = request.get_json() or {}
    category = data.get("category")
    shoe_id = data.get("id")
    qty = data.get("qty")

    try:
        shoe_id = int(shoe_id)
        qty = int(qty)
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid input formats"}), 400

    if category not in shoes or shoe_id not in shoes[category]:
        return jsonify({"success": False, "message": "Shoe not found"}), 404

    shoes[category][shoe_id]["stock"] += qty
    return jsonify({
        "success": True,
        "message": "Stock updated successfully!",
        "new_stock": shoes[category][shoe_id]["stock"]
    })

@app.route('/api/admin/price', methods=['POST'])
def api_change_price():
    data = request.get_json() or {}
    category = data.get("category")
    shoe_id = data.get("id")
    price = data.get("price")

    try:
        shoe_id = int(shoe_id)
        price = int(price)
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid input formats"}), 400

    if category not in shoes or shoe_id not in shoes[category]:
        return jsonify({"success": False, "message": "Shoe not found"}), 404

    shoes[category][shoe_id]["price"] = price
    return jsonify({
        "success": True,
        "message": "Price updated successfully!",
        "new_price": shoes[category][shoe_id]["price"]
    })

@app.route('/api/bills', methods=['GET'])
def api_get_bills():
    if not os.path.exists("nikeshope.txt"):
        return jsonify({"success": True, "count": 0, "bills": []})
        
    try:
        with open("nikeshope.txt", "r", encoding="utf-8") as f:
            content = f.read()
            
        # Split by the header separator
        raw_bills = content.split("========== NIKE SHOP BILL ==========")
        bills_list = []
        for rb in raw_bills:
            rb_stripped = rb.strip()
            if not rb_stripped:
                continue
            
            # Reconstruct the separator line and format nicely
            bill_block = "========== NIKE SHOP BILL ==========\n" + rb_stripped
            bills_list.append(bill_block)
            
        return jsonify({
            "success": True,
            "count": len(bills_list),
            "bills": bills_list
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Could not read bills: {e}"}), 500

# =================== STATIC FILE SERVERS ===================
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static_root(path):
    if os.path.exists(os.path.join('static', path)):
        return send_from_directory('static', path)
    return "Not Found", 404

# =================== IMAGE ASSET RECOVERY ===================
def copy_images_if_present():
    src_dir = r"C:\Users\caree\.gemini\antigravity-ide\brain\7efba58a-4144-4fe8-80d8-1f15e7a50153"
    dest_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "images")
    os.makedirs(dest_dir, exist_ok=True)
    
    image_mappings = {
        "nike_air_max": "nike_air_max.png",
        "nike_jordan": "nike_jordan.png",
        "nike_pegasus": "nike_pegasus.png",
        "nike_dunk": "nike_dunk.png"
    }
    
    if os.path.exists(src_dir):
        files = os.listdir(src_dir)
        for f in files:
            for prefix, target_name in image_mappings.items():
                if f.startswith(prefix) and f.endswith(".png"):
                    src_file = os.path.join(src_dir, f)
                    dest_file = os.path.join(dest_dir, target_name)
                    if not os.path.exists(dest_file) or os.path.getsize(src_file) != os.path.getsize(dest_file):
                        try:
                            shutil.copy2(src_file, dest_file)
                            print(f"[OK] Copied {f} to static/images/{target_name}")
                        except Exception as e:
                            print(f"Error copying {f}: {e}")

# Disable static file caching in development
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

# =================== START SERVER ===================
if __name__ == "__main__":
    copy_images_if_present()
    
    print("\n[START] Starting Nike Shop Web Server...")
    print("-> Open http://localhost:5000 in your browser to view the frontend!")
    print("Press Ctrl+C to stop the server.")
    
    # Run server without debugging to avoid re-importing issues in subprocesses
    app.run(host='0.0.0.0', port=5000, debug=False)
