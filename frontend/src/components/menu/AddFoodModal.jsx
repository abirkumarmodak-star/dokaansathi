import { useState, useEffect } from "react";

function AddFoodModal({

    onClose,

    selectedFood,

    onSave

}) {

    // ==========================
    // STATES
    // ==========================

    const [foodName, setFoodName] = useState("");

    const [category, setCategory] = useState("");

    const [servingType, setServingType] = useState("Plate");

    const [halfPrice, setHalfPrice] = useState("");

    const [fullPrice, setFullPrice] = useState("");

    const [status, setStatus] = useState("Available");
        // ==========================
    // LOAD DATA FOR EDIT
    // ==========================

    useEffect(() => {

        if (selectedFood) {

            setFoodName(selectedFood.name || "");

            setCategory(selectedFood.category || "");

            setServingType(

                selectedFood.serving_type ||

                "Plate"

            );

            setHalfPrice(

                selectedFood.halfPrice || ""

            );

            setFullPrice(

                selectedFood.fullPrice ||

                selectedFood.price ||

                ""

            );

            setStatus(

                selectedFood.status ||

                "Available"

            );

        }

    }, [selectedFood]);
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

                {/* Food Name */}

                <input

                    type="text"

                    placeholder="Food Name"

                    value={foodName}

                    onChange={(e) =>

                        setFoodName(e.target.value)

                    }

                />

                {/* Category */}

                <select

                    value={category}

                    onChange={(e) =>

                        setCategory(e.target.value)

                    }

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

                {/* Serving Type */}

                <select

                    value={servingType}

                    onChange={(e) =>

                        setServingType(e.target.value)

                    }

                >

                    <option value="Plate">Plate</option>

                    <option value="Piece">Piece</option>

                    <option value="Glass">Glass</option>

                    <option value="Bowl">Bowl</option>

                </select>
                                {/* ==========================
                    PRICE SECTION
                ========================== */}

                {

                    servingType === "Plate"

                    &&

                    <>

                        <input

                            type="number"

                            placeholder="Half Plate Price (Optional)"

                            value={halfPrice}

                            onChange={(e) =>

                                setHalfPrice(e.target.value)

                            }

                        />

                        <input

                            type="number"

                            placeholder="Full Plate Price"

                            value={fullPrice}

                            onChange={(e) =>

                                setFullPrice(e.target.value)

                            }

                        />

                    </>

                }

                {

                    servingType !== "Plate"

                    &&

                    <input

                        type="number"

                        placeholder={`${servingType} Price`}

                        value={fullPrice}

                        onChange={(e) =>

                            setFullPrice(e.target.value)

                        }

                    />

                }

                {/* Status */}

                <select

                    value={status}

                    onChange={(e) =>

                        setStatus(e.target.value)

                    }

                >

                    <option value="Available">

                        Available

                    </option>

                    <option value="Unavailable">

                        Unavailable

                    </option>

                </select>
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

                                        : servingType

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