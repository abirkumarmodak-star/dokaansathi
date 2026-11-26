
import { useState, useEffect } from "react";

function AddFoodModal({ onClose, selectedFood, onSave }) {

    // ==========================
    // EXISTING STATES
    // ==========================

    const [foodName, setFoodName] = useState("");
    const [category, setCategory] = useState("");
    const [servingType, setServingType] = useState("Plate");
    const [halfPrice, setHalfPrice] = useState("");
    const [fullPrice, setFullPrice] = useState("");
    const [status, setStatus] = useState("Available");

    // ==========================
    // INGREDIENT STATE
    // ==========================

    const [ingredients, setIngredients] = useState([]);

    // ==========================
    // LOAD DATA FOR EDIT
    // ==========================

    useEffect(() => {

        if (selectedFood) {

            setFoodName(selectedFood.name || "");
            setCategory(selectedFood.category || "");
            setServingType(selectedFood.serving_type || "Plate");

            setHalfPrice(selectedFood.halfPrice ?? "");
            setFullPrice(
                selectedFood.fullPrice ??
                selectedFood.price ??
                ""
            );

            setStatus(selectedFood.status || "Available");

            setIngredients(
                Array.isArray(selectedFood.ingredients)
                    ? selectedFood.ingredients.map((item) => ({
                        ingredient_name: item.ingredient_name || "",
                        half_quantity: item.half_quantity ?? "",
                        full_quantity: item.full_quantity ?? "",
                        unit: item.unit || ""
                    }))
                    : []
            );

        } else {

            setFoodName("");
            setCategory("");
            setServingType("Plate");
            setHalfPrice("");
            setFullPrice("");
            setStatus("Available");
            setIngredients([]);

        }

    }, [selectedFood]);

    // ==========================
    // INGREDIENT FUNCTIONS
    // ==========================

    const addIngredient = () => {

        setIngredients((prev) => [
            ...prev,
            {
                ingredient_name: "",
                half_quantity: "",
                full_quantity: "",
                unit: ""
            }
        ]);

    };

    const updateIngredient = (index, field, value) => {

        setIngredients((prev) =>
            prev.map((item, i) =>
                i === index
                    ? { ...item, [field]: value }
                    : item
            )
        );

    };

    const removeIngredient = (index) => {

        setIngredients((prev) =>
            prev.filter((_, i) => i !== index)
        );

    };

    // ==========================
    // UI
    // ==========================

    return (

        <div className="modal-overlay">

            <div className="modal">

                <h2>
                    {
                        selectedFood
                            ? "✏️ Edit Food"
                            : "🍽 Add New Food"
                    }
                </h2>

                {/* FOOD NAME */}

                <input
                    type="text"
                    placeholder="Food Name"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                />

                {/* CATEGORY */}

                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="">Select Category</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Chicken">Chicken</option>
                    <option value="Paneer">Paneer</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Biryani">Biryani</option>
                    <option value="Roll">Roll</option>
                    <option value="Roti">Roti</option>
                    <option value="Beverage">Beverage</option>
                </select>

                {/* SERVING TYPE */}

                <select
                    value={servingType}
                    onChange={(e) => setServingType(e.target.value)}
                >
                    <option value="Plate">Plate</option>
                    <option value="Piece">Piece</option>
                    <option value="Glass">Glass</option>
                    <option value="Bowl">Bowl</option>
                </select>

                {/* PRICE SECTION */}

                {servingType === "Plate" && (

                    <>
                        <input
                            type="number"
                            placeholder="Half Plate Price (Optional)"
                            value={halfPrice}
                            onChange={(e) => setHalfPrice(e.target.value)}
                        />

                        <input
                            type="number"
                            placeholder="Full Plate Price"
                            value={fullPrice}
                            onChange={(e) => setFullPrice(e.target.value)}
                        />
                    </>

                )}

                {servingType !== "Plate" && (

                    <input
                        type="number"
                        placeholder={`${servingType} Price`}
                        value={fullPrice}
                        onChange={(e) => setFullPrice(e.target.value)}
                    />

                )}

                {/* ==========================
                    INGREDIENT SECTION
                ========================== */}

                <div
                    className="ingredient-section"
                    style={{
                        marginTop: "20px",
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "8px"
                    }}
                >

                    <h3>Ingredients / কী কী থাকছে</h3>

                    <p>
                        Food-এর Ingredient এবং Half/Full Plate অনুযায়ী
                        Quantity লিখুন।
                    </p>

                    {ingredients.map((item, index) => (

                        <div
                            key={index}
                            style={{
                                border: "1px solid #eee",
                                padding: "10px",
                                marginBottom: "12px",
                                borderRadius: "6px"
                            }}
                        >

                            <strong>
                                Ingredient {index + 1}
                            </strong>

                            <input
                                type="text"
                                placeholder="Ingredient Name (e.g. Chicken Pieces)"
                                value={item.ingredient_name}
                                onChange={(e) =>
                                    updateIngredient(
                                        index,
                                        "ingredient_name",
                                        e.target.value
                                    )
                                }
                            />

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Half Plate Quantity"
                                value={item.half_quantity}
                                onChange={(e) =>
                                    updateIngredient(
                                        index,
                                        "half_quantity",
                                        e.target.value
                                    )
                                }
                            />

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Full Plate Quantity"
                                value={item.full_quantity}
                                onChange={(e) =>
                                    updateIngredient(
                                        index,
                                        "full_quantity",
                                        e.target.value
                                    )
                                }
                            />

                            <input
                                type="text"
                                placeholder="Unit (Piece, Gram, ml, kg)"
                                value={item.unit}
                                onChange={(e) =>
                                    updateIngredient(
                                        index,
                                        "unit",
                                        e.target.value
                                    )
                                }
                            />

                            <button
                                type="button"
                                onClick={() => removeIngredient(index)}
                                style={{ color: "red" }}
                            >
                                Remove Ingredient
                            </button>

                        </div>

                    ))}

                    <button
                        type="button"
                        onClick={addIngredient}
                    >
                        + Add Ingredient
                    </button>

                </div>

                {/* STATUS */}

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                </select>

                {/* BUTTONS */}

                <div className="modal-buttons">

                    <button
                        className="cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="save-btn"
                        onClick={() => {

                            const validIngredients = ingredients
                                .filter((item) =>
                                    item.ingredient_name.trim() !== ""
                                )
                                .map((item, index) => ({
                                    ingredient_name:
                                        item.ingredient_name.trim(),

                                    half_quantity:
                                        item.half_quantity === ""
                                            ? null
                                            : Number(item.half_quantity),

                                    full_quantity:
                                        item.full_quantity === ""
                                            ? null
                                            : Number(item.full_quantity),

                                    unit: item.unit.trim() || null,

                                    sort_order: index
                                }));

                            const foodData = {

                                name: foodName,
                                category: category,
                                servingType: servingType,

                                halfPrice:
                                    halfPrice === ""
                                        ? null
                                        : Number(halfPrice),

                                fullPrice: Number(fullPrice),

                                status: status,

                                servingSize:
                                    servingType === "Plate"
                                        ? (halfPrice !== ""
                                            ? "Half + Full"
                                            : "Full")
                                        : servingType,

                                ingredients: validIngredients

                            };

                            onSave(foodData);

                        }}
                    >

                        {
                            selectedFood
                                ? "Update Food"
                                : "Save Food"
                        }

                    </button>

                </div>

            </div>

        </div>

    );

}

export default AddFoodModal;
