const db = require("../config/db");


// GET ALL INVENTORY

exports.getInventory = (req, res) => {

    const sql = `

    SELECT

        inventory.id,
        inventory.menu_id,

        menu.name,
        menu.category,

        inventory.opening_stock,
        inventory.current_stock,
        inventory.reorder_level,

        inventory.online_sold,
        inventory.offline_sold

    FROM inventory

    JOIN menu

    ON inventory.menu_id = menu.id

    ORDER BY menu.display_order

    `;

    db.query(sql, (err, result) => {
 console.log("========== INVENTORY API DEBUG ==========");
    console.log("RAW INVENTORY RESULT:", result);
    console.log("=========================================");
        if (err) {

            return res.status(500).json(err);

        }

        const inventory = result.map(item => {

        

const remaining = Number(item.current_stock || 0);

let status = "Available";

if (remaining <= 0) {
    status = "Out Of Stock";
}
else if (remaining <= Number(item.reorder_level || 0)) {
    status = "Low Stock";
}

const isOutOfStock = remaining <= 0;

return {

    id: item.id,

    menu_id: item.menu_id,

    name: item.name,

    category: item.category,

    prepared: isOutOfStock
        ? 0
        : remaining,

    onlineSold: isOutOfStock
        ? 0
        : Number(item.online_sold || 0),

    offlineSold: isOutOfStock
        ? 0
        : Number(item.offline_sold || 0),

    remaining: isOutOfStock
        ? 0
        : remaining,

    unit: "Plate",

    status

};


        });

        res.json(inventory);

    });

};
// LOW STOCK ALERT

exports.getLowStock = (req, res) => {


    const sql = `

    SELECT

    inventory.id,
    inventory.menu_id,
    menu.name,
    inventory.stock_quantity,
    inventory.reorder_level

    FROM inventory

    JOIN menu

    ON inventory.menu_id = menu.id

    WHERE inventory.stock_quantity <= inventory.reorder_level

    `;


    db.query(sql, (err, result) => {


        if(err){

            return res.status(500).json({
                error: err
            });

        }


        res.json({

            message:"Low Stock Items",

            count: result.length,

            items: result

        });


    });


};
exports.updateOpeningStock = (req, res) => {

    const { menu_id, opening_stock } = req.body;

    const sql = `
        UPDATE inventory
        SET
            opening_stock = ?,
            current_stock = ?
        WHERE menu_id = ?
    `;

    db.query(
        sql,
        [opening_stock, opening_stock, menu_id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err
                });
            }

            res.json({
                message: "Opening Stock Updated Successfully"
            });

        }
    );

};
exports.updateStock = (req, res) => {

    const { menu_id, opening_stock } = req.body;

    const sql = `
        UPDATE inventory
        SET
            opening_stock = ?,
            current_stock = ?,
            stock_quantity = ?,
            last_updated = NOW()
        WHERE menu_id = ?
    `;

    db.query(
        sql,
        [opening_stock, opening_stock, opening_stock, menu_id],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err
                });
            }

            res.json({
                success: true,
                message: "Stock Updated Successfully"
            });

        }
    );

};