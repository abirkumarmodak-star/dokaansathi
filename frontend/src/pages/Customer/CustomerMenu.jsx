import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const CustomerMenu = () => {

    const { qrCode } = useParams();

    const navigate = useNavigate();

    // ======================================================
    // MENU
    // ======================================================

    const [menu, setMenu] = useState([]);

    // ======================================================
    // CART
    // ======================================================

    const [cart, setCart] = useState([]);

    // ======================================================
    // LOADING / ERROR
    // ======================================================

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    // ======================================================
    // SEARCH
    // ======================================================

    const [searchText, setSearchText] = useState("");

    // ======================================================
    // CATEGORY FILTER
    // ======================================================

    const [selectedCategory, setSelectedCategory] =
        useState("All");

    // ======================================================
    // FOOD IMAGE
    // ======================================================
// ======================================================
// FOOD IMAGE + FOOD INFORMATION MAP
// ======================================================

const foodImageMap = {

    "chhola botora": {
        image:
            "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium Spicy • Crispy Bhatura with spicy Chhola"
    },

    "veg thali": {
        image:
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
        info:
            "🥗 Vegetarian • Complete Indian meal"
    },

    "masala dosa": {
        image:
            "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Crispy dosa with masala filling"
    },

    "alu porota": {
        image:
            "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=700&q=80",
        info:
            "🧈 Mild • Crispy stuffed potato paratha"
    },

    "paneer porota": {
        image:
            "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=700&q=80",
        info:
            "🥛 Mild • Stuffed paneer paratha"
    },

    "puri sabji": {
        image:
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Mild • Puri served with sabji"
    },

    "idli": {
        image:
            "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=700&q=80",
        info:
            "🥗 Mild • Soft South Indian steamed idli"
    },

    "chicken dry fry": {
        image:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Dry fried chicken"
    },

    "chicken pokra special": {
        image:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Special chicken preparation"
    },

    "chicken kossa": {
        image:
            "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Bengali-style slow cooked chicken"
    },

    "chicken kadhai": {
        image:
            "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Chicken cooked with capsicum and spices"
    },

    "chicken do pyaza": {
        image:
            "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Chicken with onion-based gravy"
    },

    "chicken masala": {
        image:
            "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Chicken in rich masala gravy"
    },

    "chicken curry": {
        image:
            "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Classic chicken curry"
    },

    "chicken butter masala": {
        image:
            "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80",
        info:
            "🧈 Mild • Creamy buttery chicken gravy"
    },

    "chicken bharta": {
        image:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Spiced shredded chicken preparation"
    },

    "egg tarka": {
        image:
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Egg cooked with aromatic tadka"
    },

    "paneer pokora": {
        image:
            "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Crispy paneer fritters"
    },

    "french fries": {
        image:
            "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80",
        info:
            "🧂 Mild • Crispy golden fries"
    },

    "veg pokora": {
        image:
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Crispy vegetable fritters"
    },

    "baby corn chilli": {
        image:
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Indo-Chinese baby corn"
    },

    "masrom chili": {
        image:
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Indo-Chinese mushroom preparation"
    },

    "masrom masala": {
        image:
            "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Mushroom cooked in masala"
    },

    "paneer butter masala": {
        image:
            "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=80",
        info:
            "🧈 Mild • Creamy paneer butter gravy"
    },

    "paneer jalfrezi": {
        image:
            "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Paneer with vegetables and spices"
    },

    "paneer kadhai": {
        image:
            "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Kadai-style paneer"
    },

    "paneer do pyaza": {
        image:
            "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Paneer with onion gravy"
    },

    "veg jalfrezi": {
        image:
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Mixed vegetables with spices"
    },

    "veg do pyaza": {
        image:
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Vegetables with onion gravy"
    },

    "soya chilli": {
        image:
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Indo-Chinese soya preparation"
    },

    "palan tarka": {
        image:
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Spinach with aromatic tadka"
    },

    "chana masala": {
        image:
            "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Chickpeas cooked with masala"
    },

    "dal makhani": {
        image:
            "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=80",
        info:
            "🧈 Mild • Creamy black lentil preparation"
    },

    "mix veg": {
        image:
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
        info:
            "🥗 Vegetarian • Mixed seasonal vegetables"
    },

    "special tarka": {
        image:
            "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Special dal with tadka"
    },

    "chicken chilli": {
        image:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️🌶️ Spicy • Indo-Chinese chilli chicken"
    },

    "chicken lollipop": {
        image:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Crispy chicken lollipop"
    },

    "chicken manchurian": {
        image:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Indo-Chinese chicken Manchurian"
    },

    "patto chilli": {
        image:
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Crispy chilli potato"
    },

    "chana chilli": {
        image:
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Chana in chilli sauce"
    },

    "chana dry": {
        image:
            "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Dry spiced chickpeas"
    },

    "corn dry": {
        image:
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Crispy corn preparation"
    },

    "corn chat": {
        image:
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Tangy corn chaat"
    },

    "egg chilli": {
        image:
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Egg in chilli sauce"
    },

    "egg pokora": {
        image:
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Crispy egg pakora"
    },

    "chicken 65": {
        image:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️🌶️ Spicy • Crispy South Indian chicken"
    },

    "paneer chilli": {
        image:
            "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Indo-Chinese chilli paneer"
    },

    "veg biryani": {
        image:
            "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Aromatic vegetable biryani"
    },

    "egg biryani": {
        image:
            "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Biryani with egg"
    },

    "chiken biryani": {
        image:
            "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Medium-Spicy • Chicken biryani"
    },

    "mix biryani": {
        image:
            "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Medium-Spicy • Mixed biryani"
    },

    "lachha paratha": {
        image:
            "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=700&q=80",
        info:
            "🧈 Mild • Layered crispy paratha"
    },

    "tawa roti": {
        image:
            "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=700&q=80",
        info:
            "🫓 Mild • Soft Indian flatbread"
    },

    "tandoori roti": {
        image:
            "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=700&q=80",
        info:
            "🫓 Mild • Tandoor-cooked roti"
    },

    "butter tandoori roti": {
        image:
            "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=700&q=80",
        info:
            "🧈 Mild • Tandoori roti with butter"
    },

    "masala kulcha": {
        image:
            "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Stuffed masala kulcha"
    },

    "butter nan": {
        image:
            "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=700&q=80",
        info:
            "🧈 Mild • Soft naan with butter"
    },

    "veg chowmein": {
        image:
            "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Vegetable Indo-Chinese noodles"
    },

    "egg chowmein": {
        image:
            "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Egg noodles with vegetables"
    },

    "chicken chowmein": {
        image:
            "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Chicken Indo-Chinese noodles"
    },

    "mix chowmein": {
        image:
            "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Mixed Indo-Chinese noodles"
    },

    "paneer chowmein": {
        image:
            "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Paneer noodles"
    },

    "veg fried rice": {
        image:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Vegetable fried rice"
    },

    "egg fried rice": {
        image:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Egg fried rice"
    },

    "jeera rice": {
        image:
            "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80",
        info:
            "🟡 Mild • Aromatic cumin rice"
    },

    "chicken fried rice": {
        image:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Chicken fried rice"
    },

    "mix fried rice": {
        image:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Mixed fried rice"
    },

    "egg roll": {
        image:
            "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Egg-filled Indian roll"
    },

    "double egg roll": {
        image:
            "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Double egg roll"
    },

    "chicken egg roll": {
        image:
            "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️🌶️ Spicy • Chicken and egg roll"
    },

    "paneer roll": {
        image:
            "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=700&q=80",
        info:
            "🌶️ Medium • Paneer-filled roll"
    }

};


// ======================================================
// GET FOOD IMAGE
// ======================================================

const getFoodImage = (item) => {

    // Backend image has highest priority
    if (item?.image_url) {
        return item.image_url;
    }

    if (item?.image) {
        return item.image;
    }

    const foodName =
        String(item?.name || "")
            .trim()
            .toLowerCase();

    return (
        foodImageMap[foodName]?.image ||
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80"
    );
};


// ======================================================
// GET FOOD INFORMATION
// ======================================================

const getFoodInfo = (item) => {

    const foodName =
        String(item?.name || "")
            .trim()
            .toLowerCase();

    return (
        foodImageMap[foodName]?.info ||
        "🍽️ Delicious food • Ask the restaurant for details"
    );
};

    // ======================================================
    // LOAD MENU
    // ======================================================

    useEffect(() => {

        if (qrCode) {

            localStorage.setItem(
                "qrCode",
                qrCode
            );

        }

        fetchMenu();

        const savedCart =
            JSON.parse(
                localStorage.getItem("cart")
            ) || [];

        setCart(savedCart);

    }, [qrCode]);
    // ======================================================
// FETCH MENU FROM BACKEND
// ======================================================

const fetchMenu = async () => {

    try {

        setLoading(true);

        setError("");

        const response =
            await fetch(
                 "https://dokaansathi.onrender.com/api/menu"
            );

        const data =
            await response.json();

        console.log(
            "========== MENU RESPONSE =========="
        );

        console.log(data);

        console.log(
            "==================================="
        );


        if (!response.ok) {

            setError(
                data.message ||
                "Menu Loading Failed"
            );

            return;

        }


        // ==================================================
        // API RESPONSE
        // ==================================================

        if (Array.isArray(data)) {

            setMenu(data);

        }

        else if (
            data &&
            Array.isArray(data.menu)
        ) {

            setMenu(data.menu);

        }

        else {

            setMenu([]);

            setError(
                "Menu Loading Failed"
            );

        }

    }

    catch (err) {

        console.log(
            "MENU ERROR :",
            err
        );

        setError(
            "Server Connection Failed"
        );

    }

    finally {

        setLoading(false);

    }

};


// ======================================================
// ADD TO CART
// ======================================================

const addToCart = (
    item,
    plateType
) => {

    console.log(
        "========== ADD TO CART DEBUG =========="
    );

    console.log(
        "ITEM:",
        item
    );

    console.log(
        "MENU ID:",
        item?.id
    );

    console.log(
        "FOOD:",
        item?.name
    );

    console.log(
        "CURRENT STOCK:",
        item?.current_stock
    );

    console.log(
        "STOCK QUANTITY:",
        item?.stock_quantity
    );

    console.log(
        "PLATE TYPE:",
        plateType
    );


    // ==================================================
    // AVAILABILITY CHECK
    // ==================================================

    if (
        Number(item.available) !== 1
    ) {

        alert(
            `Sorry, ${item.name} is not available now.`
        );

        return;

    }


    // ==================================================
    // AVAILABLE INVENTORY STOCK
    // ==================================================

    const availableStock =
        Number(
            item?.current_stock ??
            item?.stock_quantity ??
            0
        );


    console.log(
        "CALCULATED AVAILABLE STOCK:",
        availableStock
    );


    // ==================================================
    // GET SAVED CART
    // ==================================================

    const savedCart =
        JSON.parse(
            localStorage.getItem("cart") ||
            "[]"
        );


    // ==================================================
    // FIND EXISTING ITEM
    // ==================================================

    const existingItem =
        savedCart.find(
            product =>
                Number(product.id) ===
                    Number(item.id) &&
                product.plateType ===
                    plateType
        );


    // ==================================================
    // CURRENT CART QUANTITY
    // ==================================================

    const currentCartQuantity =
        existingItem
            ? Number(
                existingItem.quantity || 0
            )
            : 0;


    // ==================================================
    // NEW TOTAL QUANTITY
    // ==================================================

    const newTotalQuantity =
        currentCartQuantity + 1;


    console.log(
        "CURRENT CART QUANTITY:",
        currentCartQuantity
    );

    console.log(
        "NEW TOTAL QUANTITY:",
        newTotalQuantity
    );


    // ==================================================
    // STOCK LIMIT CHECK
    // ==================================================

    if (
        newTotalQuantity >
        availableStock
    ) {

        alert(
            `${item.name} এর মাত্র ${availableStock} টি বাকি আছে।`
        );

        console.log(
            "❌ STOCK LIMIT REACHED"
        );

        console.log(
            "AVAILABLE:",
            availableStock
        );

        console.log(
            "REQUESTED:",
            newTotalQuantity
        );

        return;

    }


    // ==================================================
    // PRICE
    // ==================================================

    const price =
        plateType === "Half"
            ? Number(item.half_price)
            : Number(item.full_price);


    // ==================================================
    // UPDATE CART
    // ==================================================

    if (existingItem) {

        existingItem.quantity += 1;

    }

    else {

        savedCart.push({

            id:
                item.id,

            name:
                item.name,

            category:
                item.category,

            plateType:
                plateType,

            price:
                price,

            quantity:
                1

        });

    }


    // ==================================================
    // SAVE CART
    // ==================================================

    localStorage.setItem(
        "cart",
        JSON.stringify(savedCart)
    );

    setCart(
        savedCart
    );


    console.log(
        "UPDATED CART:",
        savedCart
    );

    console.log(
        "======================================"
    );


    // ==================================================
    // SUCCESS
    // ==================================================

    alert(
        `${item.name} (${plateType}) Added`
    );

};
// ======================================================
// OPEN CART
// ======================================================

const openCart = () => {

    navigate(
        "/checkout"
    );

};


// ======================================================
// LOADING
// ======================================================

if (loading) {

    return (

        <div
            style={{
                padding: "30px",
                textAlign: "center"
            }}
        >

            <h2>
                Loading Menu...
            </h2>

        </div>

    );

}


// ======================================================
// ERROR
// ======================================================

if (error) {

    return (

        <div
            style={{
                padding: "30px",
                textAlign: "center"
            }}
        >

            <h2
                style={{
                    color: "red"
                }}
            >
                {error}
            </h2>


            <button
                onClick={fetchMenu}
            >
                Retry
            </button>

        </div>

    );

}
// ======================================================
// UI
// ======================================================

return (

    <div
        style={{
            padding: "20px",
            maxWidth: "1200px",
            margin: "auto"
        }}
    >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                gap: "15px",
                flexWrap: "wrap"
            }}
        >

            <div>

                <h1>
                    🍽️ Customer Menu
                </h1>

                <p>
                    Choose your favourite food
                </p>

            </div>


            {/* ==================================================
                TOP CART
            ================================================== */}

            <button
                onClick={openCart}
                style={{
                    padding: "12px 20px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    borderRadius: "8px",
                    border: "none",
                    background: "#f1f1f1"
                }}
            >

                🛒 Cart ({cart.reduce(
                    (total, item) =>
                        total + Number(item.quantity || 0),
                    0
                )})

            </button>

        </div>


        {/* ==================================================
            SEARCH
        ================================================== */}

        <div
            style={{
                marginBottom: "20px"
            }}
        >

            <input
                type="text"
                placeholder="🔍 Search food..."
                value={searchText}
                onChange={(e) =>
                    setSearchText(
                        e.target.value
                    )
                }
                style={{
                    width: "100%",
                    padding: "13px",
                    fontSize: "16px",
                    borderRadius: "10px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box"
                }}
            />

        </div>


        {/* ==================================================
            CATEGORY FILTER
        ================================================== */}

        <div
            style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "25px"
            }}
        >

            {[
                "All",
                ...new Set(
                    menu
                        .map(item =>
                            item.category
                        )
                        .filter(Boolean)
                )
            ].map(category => (

                <button
                    key={category}
                    onClick={() =>
                        setSelectedCategory(
                            category
                        )
                    }
                    style={{
                        padding: "9px 15px",
                        borderRadius: "20px",
                        border: "1px solid #ccc",
                        cursor: "pointer",
                        fontWeight: "bold",
                        background:
                            selectedCategory === category
                                ? "#222"
                                : "#f5f5f5",
                        color:
                            selectedCategory === category
                                ? "white"
                                : "black"
                    }}
                >

                    {category}

                </button>

            ))}

        </div>
                {/* ==================================================
            MENU GRID
        ================================================== */}

        <div
            style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px"
            }}
        >

            {menu
                .filter(item => {

                    const matchesSearch =
                        String(
                            item.name || ""
                        )
                            .toLowerCase()
                            .includes(
                                searchText
                                    .toLowerCase()
                            );

                    const matchesCategory =
                        selectedCategory === "All" ||
                        item.category ===
                            selectedCategory;

                    return (
                        matchesSearch &&
                        matchesCategory
                    );

                })
                .map(item => {

                    const availableStock =
    Number(
        item?.current_stock ??
        item?.stock_quantity ??
        0
    );

const isAvailable =
    Number(item.available) === 1 &&
    availableStock > 0;


                    return (

                        <div
                            key={item.id}
                            style={{
                                border:
                                    "1px solid #ddd",

                                borderRadius:
                                    "16px",

                                overflow:
                                    "hidden",

                                background:
                                    "white",

                                boxShadow:
                                    "0 3px 12px rgba(0,0,0,0.10)",

                                opacity:
                                    isAvailable
                                        ? 1
                                        : 0.65
                            }}
                        >

                            {/* ==================================================
                                FOOD IMAGE
                            ================================================== */}

                            <img
                                src={
                                    getFoodImage(item)
                                }
                                alt={
                                    item.name
                                }
                                style={{
                                    width: "100%",
                                    height: "190px",
                                    objectFit: "cover",
                                    display: "block"
                                }}

                                onError={(event) => {

                                    event.currentTarget.src =
                                        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80";

                                }}
                            />


                            {/* ==================================================
                                FOOD INFORMATION
                            ================================================== */}

                            <div
                                style={{
                                    padding: "16px"
                                }}
                            >

                                <h2
                                    style={{
                                        margin:
                                            "0 0 8px 0"
                                    }}
                                >
                                    {item.name}
                                </h2>
<p
    style={{
        margin: "0 0 10px 0",
        color: "#555",
        fontSize: "14px",
        fontWeight: "600"
    }}
>
    {getFoodInfo(item)}
</p>

                                <p
                                    style={{
                                        margin:
                                            "0 0 8px 0"
                                    }}
                                >

                                    <strong>
                                        Category:
                                    </strong>{" "}

                                    {item.category}

                                </p>


                                {/* ==================================================
                                    AVAILABILITY
                                ================================================== */}

                                {isAvailable ? (

                                    <p
                                        style={{
                                            color:
                                                "green",
                                            fontWeight:
                                                "bold"
                                        }}
                                    >
                                        🟢 Available
                                    </p>

                                ) : (

                                    <p
                                        style={{
                                            color:
                                                "red",
                                            fontWeight:
                                                "bold"
                                        }}
                                    >
                                        🔴 Sorry,{" "}
                                        {item.name}{" "}
                                        is not available now.
                                    </p>

                                )}


                                {/* ==================================================
                                    AVAILABLE ITEM
                                ================================================== */}

                                {isAvailable ? (

                                    <>

                                        {/* ==================================================
                                            HALF + FULL
                                        ================================================== */}

                                        {item.half_price &&
                                        item.full_price ? (

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    flexDirection:
                                                        "column",
                                                    gap:
                                                        "10px"
                                                }}
                                            >

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        gap:
                                                            "8px",
                                                        flexWrap:
                                                            "wrap"
                                                    }}
                                                >

                                                    <button
                                                        onClick={() =>
                                                            addToCart(
                                                                item,
                                                                "Half"
                                                            )
                                                        }
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            cursor:
                                                                "pointer",
                                                            fontWeight:
                                                                "bold"
                                                        }}
                                                    >
                                                        ➕ Add Half
                                                    </button>


                                                    <button
                                                        onClick={
                                                            openCart
                                                        }
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            cursor:
                                                                "pointer",
                                                            fontWeight:
                                                                "bold"
                                                        }}
                                                    >
                                                        🛒 View Cart
                                                    </button>

                                                </div>


                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        gap:
                                                            "8px",
                                                        flexWrap:
                                                            "wrap"
                                                    }}
                                                >

                                                    <button
                                                        onClick={() =>
                                                            addToCart(
                                                                item,
                                                                "Full"
                                                            )
                                                        }
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            cursor:
                                                                "pointer",
                                                            fontWeight:
                                                                "bold"
                                                        }}
                                                    >
                                                        ➕ Add Full
                                                    </button>


                                                    <button
                                                        onClick={
                                                            openCart
                                                        }
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            cursor:
                                                                "pointer",
                                                            fontWeight:
                                                                "bold"
                                                        }}
                                                    >
                                                        🛒 View Cart
                                                    </button>

                                                </div>

                                            </div>

                                        ) : (

                                            /* ==================================================
                                                FULL ONLY
                                            ================================================== */

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    gap:
                                                        "8px",
                                                    flexWrap:
                                                        "wrap"
                                                }}
                                            >

                                                <button
                                                    onClick={() =>
                                                        addToCart(
                                                            item,
                                                            "Full"
                                                        )
                                                    }
                                                    style={{
                                                        padding:
                                                            "10px 14px",
                                                        cursor:
                                                            "pointer",
                                                        fontWeight:
                                                            "bold"
                                                    }}
                                                >
                                                    ➕ Add Full
                                                </button>


                                                <button
                                                    onClick={
                                                        openCart
                                                    }
                                                    style={{
                                                        padding:
                                                            "10px 14px",
                                                        cursor:
                                                            "pointer",
                                                        fontWeight:
                                                            "bold"
                                                    }}
                                                >
                                                    🛒 View Cart
                                                </button>

                                            </div>

                                        )}

                                    </>

                                ) : (

                                    /* ==================================================
                                        UNAVAILABLE ITEM
                                    ================================================== */

                                    <div
                                        style={{
                                            marginTop:
                                                "12px",
                                            padding:
                                                "12px",
                                            background:
                                                "#f5f5f5",
                                            borderRadius:
                                                "8px",
                                            textAlign:
                                                "center"
                                        }}
                                    >

                                        <strong>
                                            ❌ Not Available
                                        </strong>

                                        <p>
                                            Please choose
                                            another item. 😊
                                        </p>

                                    </div>

                                )}

                            </div>

                        </div>

                    );

                })}

        </div>
                {/* ==================================================
            NO SEARCH RESULT
        ================================================== */}

        {menu.filter(item => {

            const matchesSearch =
                String(
                    item.name || ""
                )
                    .toLowerCase()
                    .includes(
                        searchText.toLowerCase()
                    );

            const matchesCategory =
                selectedCategory === "All" ||
                item.category ===
                    selectedCategory;

            return (
                matchesSearch &&
                matchesCategory
            );

        }).length === 0 && (

            <div
                style={{
                    textAlign: "center",
                    padding: "40px 20px"
                }}
            >

                <h2>
                    😔 No food found
                </h2>

                <p>
                    Please try another food
                    or category.
                </p>

            </div>

        )}


        {/* ==================================================
            BOTTOM VIEW CART
        ================================================== */}

        {cart.length > 0 && (

            <div
                style={{
                    marginTop: "30px",
                    textAlign: "center"
                }}
            >

                <button
                    onClick={openCart}
                    style={{
                        padding: "14px 30px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        borderRadius: "10px",
                        border: "none",
                        background: "#222",
                        color: "white"
                    }}
                >

                    🛒 View Cart (
                    {cart.reduce(
                        (total, item) =>
                            total +
                            Number(
                                item.quantity || 0
                            ),
                        0
                    )}
                    )

                </button>

            </div>

        )}

    </div>

);

};


export default CustomerMenu;