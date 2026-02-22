import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_EIA_KEY;

async function checkEia() {
    try {
        const url = `https://api.eia.gov/v2/petroleum/pri/spt/facet/series?api_key=${apiKey}`;
        const res = await axios.get(url);
        console.log(JSON.stringify(res.data.response.facets, null, 2));
    } catch (e) {
        console.error(e.message);
    }
}
checkEia();
