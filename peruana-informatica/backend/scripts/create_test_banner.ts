
import { PromoBanner } from '../src/models/PromoBanner';
import { connectDatabase } from '../src/config/database';

async function createTestBanner() {
    try {
        await connectDatabase();

        // Deactivate all existing banners to ensure clean test
        await PromoBanner.update({ is_active: false }, { where: {} });

        const banner = await PromoBanner.create({
            title: "Test Banner AI",
            description: "Banner de prueba generado automáticamente",
            image_url: "https://placehold.co/800x600/png?text=TEST+BANNER",
            coupon_code: "TEST20",
            show_as_popup: true, // IMPORTANT: Enable popup
            popup_delay: 2,
            priority: 10,
            is_active: true
        });

        console.log("✅ Test Banner Created:", banner.toJSON());
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

createTestBanner();
