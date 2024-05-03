from datetime import datetime
import enum
from typing import Optional, Union, List

from flask_jwt_extended import get_jwt_identity
from sqlalchemy import event, desc, asc, CheckConstraint, ForeignKey
from sqlalchemy.orm import make_transient, relationship

from apps.extensions import db
from apps.user.models import User
from apps.round.models import Round, SubRound
from .company_status_history import CompanyStatusHistory

# Define many-to-many relationship tables
company_industry = db.Table(
    'company_industry',
    db.Column('id', db.Integer, primary_key=True),
    db.Column('company_id', db.Integer, db.ForeignKey('companies.id')),
    db.Column('industry_id', db.Integer, db.ForeignKey('industries.id'))
)

company_competitor = db.Table(
    'company_competitor',
    db.Column('id', db.Integer, primary_key=True),
    db.Column('company_id', db.Integer, db.ForeignKey('companies.id')),
    db.Column('competitor_id', db.Integer, db.ForeignKey('competitors.id'))
)

class Company(db.Model):
    __tablename__ = 'companies'

    class StatusValuesEnum(enum.Enum):
        DRAFT = 'draft'
        CALCULATING = 'calculating'
        REJECTED = "rejected"
        CLOSED = "closed"
        IN_PROGRESS = 'in_progress'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    uuid = db.Column(UUID(as_uuid=True), nullable=True)
    status = db.Column(db.Enum(StatusValuesEnum), nullable=True, default=StatusValuesEnum.DRAFT)
    progress_bar = db.Column(db.Float, CheckConstraint('progress_bar >= 0.1 AND progress_bar <= 1'), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    former_name = db.Column(db.String(100), nullable=True)
    year_founded = db.Column(db.Integer, nullable=True)
    bio = db.Column(db.String(1000), nullable=True)
    website_url = db.Column(db.String, nullable=True)
    pitchbook_url = db.Column(db.String, nullable=True)
    first_financing_date = db.Column(db.DateTime, nullable=True)
    first_financing_deal_type = db.Column(db.Integer, ForeignKey('deal_types.id'), nullable=True)
    number_competitors = db.Column(db.Integer)
    comment = db.Column(db.String(500), nullable=True)
    decision_threshold = db.Column(db.Float, nullable=True)
    total_score = db.Column(db.Float, nullable=True)
    pb_id = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=db.func.now())

    # Relationships
    industries = relationship('Industry', secondary='company_industry', backref='companies')
    deal_type = relationship("DealType", backref='companies')
    competitors = relationship('Competitor', secondary='company_competitor', backref='companies')
    user = relationship('User', backref='company')
    dashboard = relationship('Dashboard', backref='companies')
    status_history = relationship('CompanyStatusHistory', backref='company', order_by=lambda: desc(CompanyStatusHistory.created_at), lazy=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def session_add(self):
        """Add the company to the current session and update the number of competitors."""
        self.number_competitors = len(self.competitors)
        db.session.add(self)

    def save(self):
        """Commit the company to the database."""
        db.session.add(self)
        db.session.commit()

    def delete_company(self):
        """Delete the company from the database."""
        db.session.delete(self)
        db.session.commit()

    @classmethod
    def change_date_format(cls, date: Union[datetime, str]) -> Optional[str]:
        """Change the date format from datetime object or string."""
        formatted_date = None
        if date and isinstance(date, datetime):
            formatted_date = date.strftime('%Y-%m-%d %H:%M:%S')
        elif date:
            date = datetime.strptime(date, "%Y-%m-%dT%H:%M:%S.%fZ")
            formatted_date = date.strftime("%Y-%m-%d %H:%M:%S")
        return formatted_date

    def change_company_status(self, new_status: str) -> int:
        """Change the status of the company."""
        if self.status not in ['rejected', 'closed', 'in_progress', 'draft']:
            raise ValueError("Current company status should be rejected, closed, or in_progress")
        if self.status == 'draft' and new_status == 'draft':
            pass
        elif new_status.lower() == "draft" and self.status != new_status:
            company_id = self.id
            self.is_active = False
            self.save()
            self.change_status_to_draft()
            company_status_history = CompanyStatusHistory(company_id=company_id, status='draft')
            db.session.add(company_status_history)
            db.session.commit()
        elif self.status != new_status:
            self.status = new_status
            company_status_history = CompanyStatusHistory(company_id=self.id, status=self.status)
            self.save()
            db.session.add(company_status_history)
            db.session.commit()
        return self.id

    def change_status_to_draft(self):
        """Change the company status to draft."""
        identity = get_jwt_identity()
        user = User.get_user_by_email(email=identity)
        old_id = self.id
        db.session.expunge(self)
        make_transient(self)
        self.id = None
        self.dashboard_id = None
        self.status = 'draft'
        self.user_id = user.id
        self.is_active = True
        self.updated_at = None
        db.session.add(self)

        company = self.get_company_by_id(old_id)

        for competitor in company.competitors:
            self.competitors.append(competitor)

        for industry in company.industries:
            self.industries.append(industry)

        db.session.commit()

        for round in company.rounds:
            old_round_id = round.id
            db.session.expunge(round)
            make_transient(round)
            round.id = None
            round.company_id = self.id
            db.session.add(round)
            old_round = round.get_round_by_id(old_round_id)

            for sub_round in old_round.sub_rounds:
                sub_round_old_id = sub_round.id
                db.session.expunge(sub_round)
                make_transient(sub_round)
                sub_round.id = None
                sub_round.round_id = round.id
                old_sub_round = SubRound.get_sub_round_by_id(sub_round_old_id)
                for investor in old_sub_round.investors:
                    sub_round.investors.append(investor)
                db.session.add(sub_round)

                for investor in old_sub_round.investors:
                    oldRoundInvestor = Round_Investor.query.filter(Round_Investor.investor_id == investor.id, Round_Investor.round_id == sub_round_old_id).first()
                    newRoundInvestor = Round_Investor.query.filter(Round_Investor.investor_id == investor.id, Round_Investor.round_id == sub_round.id).first()
                    newRoundInvestor.lead = oldRoundInvestor.lead
                    newRoundInvestor.new = oldRoundInvestor.new
                    newRoundInvestor.corporate = oldRoundInvestor.corporate
                    db.session.add(newRoundInvestor)
            db.session.commit()

    @classmethod
    def get_company_by_id(cls, id: int) -> Optional['Company']:
        """Retrieve a company by its ID."""
        return cls.query.get(id)
