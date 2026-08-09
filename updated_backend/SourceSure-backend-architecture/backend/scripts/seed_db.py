import uuid
from datetime import datetime
from app.db.session import SessionLocal, engine, Base
from app.db.models import SourcingCase, Requirement, Supplier

def seed():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if case already exists
        case_id = "00000000-0000-0000-0000-000000000001"
        existing = db.query(SourcingCase).filter(SourcingCase.id == case_id).first()
        if existing:
            print(f"Case {case_id} already exists in DB.")
            return

        # 1. Create Sourcing Case
        case = SourcingCase(
            id=case_id,
            name="Aluminum Motor Housing",
            description="Sourcing 20,000 units/month of 5-axis CNC machined 6061 aluminum motor housings for electric powertrains.",
            evaluation_date=datetime.strptime("2026-08-08", "%Y-%m-%d"),
            status="ACTIVE",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(case)

        # 2. Add Requirements
        reqs = [
            Requirement(
                id="req-1", case_id=case_id, key="cnc_5axis", label="CNC 5-axis Capability",
                kind="MANDATORY", value_type="BOOLEAN", operator="EQ", target_value=True, notes="In-house 5-axis CNC"
            ),
            Requirement(
                id="req-2", case_id=case_id, key="material_6061", label="Aluminum 6061 Grade",
                kind="MANDATORY", value_type="BOOLEAN", operator="EQ", target_value=True, notes="AL6061-T6 certified"
            ),
            Requirement(
                id="req-3", case_id=case_id, key="iso_9001", label="ISO 9001 Certification",
                kind="MANDATORY", value_type="BOOLEAN", operator="EQ", target_value=True, notes="Valid ISO 9001 cert"
            ),
            Requirement(
                id="req-4", case_id=case_id, key="capacity_monthly", label="Monthly Capacity",
                kind="MANDATORY", value_type="NUMBER", operator="GTE", target_value=20000, unit="units", notes="Monthly output"
            ),
            Requirement(
                id="req-5", case_id=case_id, key="lead_time_days", label="Production Lead Time",
                kind="MANDATORY", value_type="NUMBER", operator="LTE", target_value=30, unit="days", notes="Dispatch lead time"
            ),
            Requirement(
                id="req-6", case_id=case_id, key="moq", label="Minimum Order Quantity",
                kind="MANDATORY", value_type="NUMBER", operator="LTE", target_value=20000, unit="units", notes="Max MOQ limit"
            ),
            Requirement(
                id="req-7", case_id=case_id, key="quality_score", label="Quality Audit Index",
                kind="PREFERENCE", value_type="NUMBER", weight=0.4, direction="HIGHER_IS_BETTER", unit="score (0-100)"
            ),
            Requirement(
                id="req-8", case_id=case_id, key="unit_cost", label="Unit Production Price",
                kind="PREFERENCE", value_type="NUMBER", weight=0.6, direction="LOWER_IS_BETTER", unit="USD"
            ),
        ]
        db.add_all(reqs)

        # 3. Add Suppliers
        sups = [
            Supplier(id="sup-1", case_id=case_id, name="Apex Precision Machining Ltd.", external_ref="SUP-APX-01", country="Germany", status="PASS", created_at=datetime.utcnow()),
            Supplier(id="sup-2", case_id=case_id, name="Global Alloy Components Co.", external_ref="SUP-GAC-02", country="China", status="FAIL", created_at=datetime.utcnow()),
            Supplier(id="sup-3", case_id=case_id, name="Vanguard Aerospace Parts", external_ref="SUP-VAP-03", country="United States", status="REVIEW", created_at=datetime.utcnow()),
        ]
        db.add_all(sups)

        db.commit()
        print("Successfully seeded DB with Case 00000000-0000-0000-0000-000000000001, 8 Requirements, and 3 Suppliers!")
    except Exception as e:
        db.rollback()
        print("Seeding error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed()
