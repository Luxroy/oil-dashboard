const apiKey = 'NN6Cp82HOCkOT7eZUdhX6uRjxLq7yF8u3bkTBC4c';

async function queryFacets() {
    const activityRes = await fetch(`https://api.eia.gov/v2/international/facet/activityId/?api_key=${apiKey}`);
    const activityData = await activityRes.json();
    console.log("Activity IDs:", JSON.stringify(activityData.response.facets.map(f => f.id + ":" + f.name), null, 2));

    const productRes = await fetch(`https://api.eia.gov/v2/international/facet/productId/?api_key=${apiKey}`);
    const productData = await productRes.json();
    const crudeProduct = productData.response.facets.find(f => f.name.toLowerCase().includes('crude oil'));
    console.log("Crude Oil Product ID:", crudeProduct);
}
queryFacets();
