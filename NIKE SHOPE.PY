import os

# ..............................................................................................

# =================== NIKE SHOP DATA ===================
# Yahan hum dictionary use kar rahe hain shoes store karne ke liye
# Outer dict keys = category (men, women, kids)
# Inner dict keys = shoe ID (1, 2, 3...)
# Har shoe ke liye ek dictionary hai: name, price, stock
shoes = {
    "men": {
        1: {"name": "Nike Air Max", "price": 20000, "stock": 30},
        2: {"name": "Nike Revolution", "price": 30000, "stock": 30},
        3: {"name": "Nike Pegasus", "price": 40000, "stock": 30},
        4: {"name": "Nike Jordan", "price": 50000, "stock": 30},
        5: {"name": "Nike Air Max DN", "price": 60000, "stock": 30},
        6: {"name": "Nike Zoomfiy 6", "price": 70000, "stock": 30},
        7: {"name": "Nike Metcon 10", "price": 80000, "stock": 30},
        8: {"name": "Nike Vaporfiy", "price": 90000, "stock": 30},
        9: {"name": "Nike Vomero Plus", "price": 100000, "stock": 30},
        10: {"name": "Nike Dunk", "price": 200000, "stock": 30},
        11: {"name": "Nike Air Force 1", "price": 300000, "stock": 30},
        12: {"name": "Nike Cortez", "price": 400000, "stock": 30},
        13: {"name": "Nike Sabrina", "price": 500000, "stock": 30},
        14: {"name": "Nike Pegasus Premium", "price": 600000, "stock": 30},
        15: {"name": "Nike Shox", "price": 700000, "stock": 30},
    },
    "women": {
        1: {"name": "Nike Sabrina", "price": 500000, "stock": 30},
        2: {"name": "Nike Pegasus Premium", "price": 600000, "stock": 30},
        3: {"name": "Nike Cortez", "price": 400000, "stock": 30},
        4: {"name": "Nike Dunk", "price": 200000, "stock": 30},
        5: {"name": "Nike Air Force 1", "price": 300000, "stock": 30},
        6: {"name": "Nike Vomero Plus", "price": 100000, "stock": 30},
    },
    "kids": {
        1: {"name": "Nike Kids Runner", "price": 15000, "stock": 30},
        2: {"name": "Nike Kids Flex", "price": 18000, "stock": 30},
        3: {"name": "Nike Kids Air Max", "price": 22000, "stock": 30},
        4: {"name": "Nike Kids Revolution", "price": 25000, "stock": 30},
        5: {"name": "Nike Kids Pegasus", "price": 28000, "stock": 30},
    }
}


# =================== DISCOUNT & BAG SETTINGS ===================
# Simple variables jo discount aur bag charge ke liye hain
discount_percent = 10       # 10% discount agar total >= discount_limit
discount_limit = 100000     # minimum total jisme discount milega
bag_price = 50              # ₹50 per bag

# =================== SELECT CATEGORY FUNCTION ===================
def select_category():
    """
    User se category choose karwane ke liye.
    Demonstrates: while loop + if-elif-else
    """
    while True:  # tab tak puchta rahega jab tak sahi input na aaye
        print("\nSelect Category")
        print("1. Men")
        print("2. Women")
        print("3. Kids")
        ch = input("Enter choice: ")  # input string

        if ch == "1":
            return "men"
        elif ch == "2":
            return "women"
        elif ch == "3":
            return "kids"
        else:
            print("❌ Invalid Category, try again!")

# =================== SHOW SHOES FUNCTION ===================
def show_shoes(category):
    """
    Selected category ke sare shoes ko table me print karta hai.
    Demonstrates: for loop + dictionary iteration + string formatting
    """
    print("\n--- Available Nike Shoes ---")
    print(f"{'ID':<5}{'Name':<25}{'Price':<15}{'Stock':<10}")
    print("-" * 60)
    for i, s in shoes[category].items():  # dictionary loop
        print(f"{i:<5}{s['name']:<25}{s['price']:<15}{s['stock']:<10}")

# =================== BUY SHOES FUNCTION ===================
def buy_shoes(category):
    """
    Shoe buy karne ka function
    Demonstrates: input(), try-except, arithmetic, dictionary access/modification
    """
    show_shoes(category)
    try:
        choice = int(input("\nEnter Shoe ID to buy: "))
        if choice in shoes[category]:
            qty = int(input("Enter quantity: "))
            if qty <= shoes[category][choice]["stock"]:  # stock check
                price = shoes[category][choice]["price"]
                total = price * qty  # total calculate

                # Discount calculate
                discount = (total * discount_percent) / 100 if total >= discount_limit else 0
                subtotal = total - discount

                # Bag charge
                bag_choice = input("Carry bag chahiye? (yes/no): ").lower()
                bag_charge = qty * bag_price if bag_choice == "yes" else 0

                final_amount = subtotal + bag_charge  # payable amount
                shoes[category][choice]["stock"] -= qty  # stock update

                # Payment mode
                print("\nSelect Payment Mode")
                print("1. Online\n2. Cash\n3. Card")
                pay_choice = input("Enter choice: ")
                payment_mode = {"1": "Online", "2": "Cash", "3": "Card"}.get(pay_choice, "Unknown")

                # Print Bill
                print("\n========== NIKE SHOP BILL ==========")
                print(f"Category    : {category.title()}")
                print(f"Shoe Name   : {shoes[category][choice]['name']}")
                print(f"Price       : ${price}")
                print(f"Quantity    : {qty}")
                print(f"Total       : ${total}")
                print(f"Discount    : ${discount}")
                print(f"Bag Charge  : ${bag_charge}")
                print(f"Payable Amt : ${final_amount}")
                print(f"Payment     : {payment_mode}")
                print(f"Remaining Stock: {shoes[category][choice]['stock']}")
                print("===================================")

                # Save Bill to File
                f = open("nikeshope.txt", "a")
                f.write("\n========== NIKE SHOP BILL ==========\n")
                f.write(f"Category    : {category.title()}\n")
                f.write(f"Shoe Name   : {shoes[category][choice]['name']}\n")
                f.write(f"Price       : ${price}\n")
                f.write(f"Quantity    : {qty}\n")
                f.write(f"Total       : ${total}\n")
                f.write(f"Discount    : ${discount}\n")
                f.write(f"Bag Charge  : ${bag_charge}\n")
                f.write(f"Payable Amt : ${final_amount}\n")
                f.write(f"Payment     : {payment_mode}\n")
                f.write("===================================\n")
                f.close()
            else:
                print(f"❌ Stock kam hai! Available stock: {shoes[category][choice]['stock']}. Try less quantity.")
        else:
            print("❌ Invalid Shoe ID")
    except ValueError:
        print("❌ Invalid input, please enter number")

# =================== ADD STOCK FUNCTION ===================
def add_stock(category):
    """
    Admin function to add stock
    Demonstrates: dictionary modification
    """
    show_shoes(category)
    choice = int(input("Enter Shoe ID: "))
    qty = int(input("Enter quantity: "))
    shoes[category][choice]["stock"] += qty  # stock add
    print("✅ Stock Updated Successfully!")

# =================== CHANGE PRICE FUNCTION ===================
def change_price(category):
    """
    Admin function to change shoe price
    Demonstrates: dictionary modification
    """
    show_shoes(category)
    choice = int(input("Enter Shoe ID: "))
    price = int(input("Enter new price: "))
    shoes[category][choice]["price"] = price  # price update
    print("✅ Price Updated Successfully!")
# =================== VIEW BILLS FUNCTION ===================
def view_bills():
    """
    Displays all bills saved in nikeshope.txt and the total count.
    """
    if not os.path.exists("nikeshope.txt"):
        print("\n📂 No bills file found (nikeshope.txt). Buy some shoes first!")
        return
        
    try:
        f = open("nikeshope.txt", "r", encoding="utf-8")
        content = f.read()
        f.close()
        
        # Count separator to see total bills
        bill_count = content.count("========== NIKE SHOP BILL ==========")
        
        if bill_count == 0:
            print("\n📂 No bills recorded in file yet!")
            return
            
        print(f"\n=====================================")
        print(f"📖 ORDER HISTORY ({bill_count} Bills Found)")
        print(f"=====================================")
        print(content.strip())
        print(f"=====================================")
    except Exception as e:
        print(f"❌ Error reading bills: {e}")

# =================== MAIN FUNCTION ===================
def main():
    """
    Program entry point
    Demonstrates: while loop, menu system, function calls
    """
    category = select_category()  # category select karva rahe hain

    while True:
        print("\n===== NIKE SHOES SHOP =====")
        print("1. View Shoes")
        print("2. Buy Shoes")
        print("3. Add Stock")
        print("4. Change Price")
        print("5. View Bills")
        print("6. Exit")
        ch = input("Enter choice: ")

        if ch == "1":
            show_shoes(category)
        elif ch == "2":
            buy_shoes(category)
        elif ch == "3":
            add_stock(category)
        elif ch == "4":
            change_price(category)
        elif ch == "5":
            view_bills()
        elif ch == "6":
            print("🙏 Thank you for shopping!")
            break
        else:
            print("❌ Invalid Choice, try again!")

# =================== RUN PROGRAM ===================
main()  # program start


# .............................................................................................

