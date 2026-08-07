function OrderStatusBadge({ status }) {

    let className = "";

    switch (status) {

        case "New":
            className = "badge-new";
            break;

        case "Preparing":
            className = "badge-preparing";
            break;

        case "Ready":
            className = "badge-ready";
            break;

        case "Completed":
            className = "badge-completed";
            break;

        case "Cancelled":
            className = "badge-cancelled";
            break;

        default:
            className = "";
    }

    return (

        <span className={`status-badge ${className}`}>

            {status}

        </span>

    );

}

export default OrderStatusBadge;