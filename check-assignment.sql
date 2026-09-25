SELECT
    id,
    order_id,
    delivery_boy_id,
    status
FROM delivery_assignments
WHERE delivery_boy_id = 9
ORDER BY id DESC;
