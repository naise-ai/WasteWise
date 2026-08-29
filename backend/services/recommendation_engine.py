# ============================================================
# WasteWise — Rule-Based Recommendation Engine
# ============================================================
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
import models


class RuleBasedRecommendationEngine:
    """
    Modular Recommendation Engine.
    Analyzes WasteRecord and FoodItem tables to dynamically generate or update recommendations.
    Can be replaced or wrapped by an ML Recommendation Engine in the future.
    """

    @staticmethod
    def generate_recommendations(db: Session) -> List[models.Recommendation]:
        # Fetch existing recommendations so we don't recreate duplicates
        existing_titles = {r.title for r in db.query(models.Recommendation).all()}

        new_recs = []

        # Rule 1: High Waste Food Items (Waste Rate > 20%)
        top_waste_items = (
            db.query(
                models.WasteRecord.food_item_name,
                func.sum(models.WasteRecord.prepared).label("total_prepared"),
                func.sum(models.WasteRecord.wasted).label("total_wasted")
            )
            .group_by(models.WasteRecord.food_item_name)
            .all()
        )

        for item_name, prep, wasted in top_waste_items:
            if prep and prep > 0:
                pct = (wasted / prep) * 100
                if pct > 20.0:
                    title = f"Reduce {item_name} Preparation"
                    if title not in existing_titles:
                        suggested_pct = 10 if pct < 25 else 15
                        rec = models.Recommendation(
                            priority="High",
                            title=title,
                            description=f"{item_name} waste is currently averaging {pct:.1f}%, exceeding the 10% target.",
                            suggested_action=f"Reduce daily {item_name.lower()} preparation by approximately {suggested_pct}% during peak service.",
                            impact=f"Expected to reduce daily {item_name.lower()} waste by {round(wasted * 0.15, 1)} kg.",
                            estimated_savings=f"₹{int(wasted * 70 * 0.3 * 30)}–₹{int(wasted * 70 * 0.5 * 30)}/month",
                            status="Active",
                            related_food_item=item_name,
                        )
                        new_recs.append(rec)
                        existing_titles.add(title)

        # Rule 2: Overproduction Concern (>30% of total waste)
        total_all_waste = db.query(func.sum(models.WasteRecord.wasted)).scalar() or 1.0
        overprod_waste = (
            db.query(func.sum(models.WasteRecord.wasted))
            .filter(models.WasteRecord.reason == "Overproduction")
            .scalar() or 0.0
        )
        if (overprod_waste / total_all_waste) > 0.30:
            title = "Address Systemic Overproduction"
            if title not in existing_titles:
                rec = models.Recommendation(
                    priority="High",
                    title=title,
                    description=f"Overproduction contributes to {round(overprod_waste / total_all_waste * 100, 1)}% of total canteen waste.",
                    suggested_action="Implement pre-service headcount estimation and progressive batch cooking.",
                    impact="Estimated 20-30% reduction in overall canteen waste.",
                    estimated_savings="₹3,500–₹5,000/month",
                    status="Active",
                )
                new_recs.append(rec)
                existing_titles.add(title)

        # Rule 3: Positive Performance Insight (Items with waste < 8%)
        for item_name, prep, wasted in top_waste_items:
            if prep and prep > 50:
                pct = (wasted / prep) * 100
                if pct < 8.0:
                    title = f"{item_name} Portion Efficiency Excellent"
                    if title not in existing_titles:
                        rec = models.Recommendation(
                            priority="Positive",
                            title=title,
                            description=f"{item_name} has maintained a low waste rate of {pct:.1f}%.",
                            suggested_action=f"Document preparation workflow for {item_name} and apply best practices to higher-waste menu items.",
                            impact="Helps set baseline standard across kitchen staff.",
                            estimated_savings="₹1,200–₹1,800/month (if replicated)",
                            status="Active",
                            related_food_item=item_name,
                        )
                        new_recs.append(rec)
                        existing_titles.add(title)

        # Rule 4: Quality / Spoilage Warning
        quality_waste = (
            db.query(func.sum(models.WasteRecord.wasted))
            .filter(models.WasteRecord.reason.in_(["Poor quality", "Spoilage"]))
            .scalar() or 0.0
        )
        if quality_waste > 10.0:
            title = "Review Ingredient Storage & Quality Control"
            if title not in existing_titles:
                rec = models.Recommendation(
                    priority="Medium",
                    title=title,
                    description=f"Quality degradation and spoilage caused {round(quality_waste, 1)} kg of waste recently.",
                    suggested_action="Inspect refrigeration storage temperature and review ingredient freshness from suppliers.",
                    impact="Prevents sudden food spoilage losses.",
                    estimated_savings="₹1,000–₹2,000/month",
                    status="Active",
                )
                new_recs.append(rec)
                existing_titles.add(title)

        if new_recs:
            db.add_all(new_recs)
            db.commit()

        return db.query(models.Recommendation).order_by(models.Recommendation.created_at.desc()).all()
