'use client';

import PromotionalCarousel from '@/components/ui/PromotionalCarousel';

export default function GlobalPromotionalCarousel() {
    return (
        <PromotionalCarousel
            promotions={[
                {
                    title: "Casino Welcome",
                    description: "Play our latest casino games",
                    percentage: "100%",
                    period: "Bonus",
                    type: "slots",
                    image: "/banners/Casino-vf.png"
                },
                {
                    title: "Sports Welcome",
                    description: "Bet on your favorite sports",
                    percentage: "100%",
                    period: "Bonus",
                    type: "sports",
                    image: "/banners/Sport-vf.png"
                },
                {
                    title: "Weekly Cashback on Sports Betting",
                    description: "Get 15% weekly cashback from what you spend on Paris sportive",
                    percentage: "15%",
                    period: "Weekly",
                    type: "sports",
                    image: "/banners/Daily-cashback-on-sportgames-vf.png"
                },
                {
                    title: "Daily Cashback on Slots",
                    description: "Get 15% daily cashback from what you spend on slot games",
                    percentage: "15%",
                    period: "Daily",
                    type: "slots",
                    image: "/banners/Daily-cashback-on-slotgames-vf.png"
                },
                {
                    title: "Daily Cashback on Live Games",
                    description: "Get 10% daily cashback from what you spend on live games",
                    percentage: "10%",
                    period: "Daily",
                    type: "live",
                    image: "/banners/Daily-cashback-on-livegames-vf.png"
                }
            ]}
            autoplayDelay={5000}
        />
    );
}
