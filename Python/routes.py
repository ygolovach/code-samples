from flask import Blueprint
from .controllers import Controller

company = Blueprint('company', __name__)
controller = Controller()

# RESTful routes for Company resource
company.route('/companies', methods=['POST'])(controller.create_company)
company.route('/companies/<int:id>', methods=['GET'])(controller.get_company)
company.route('/companies/<int:id>', methods=['PATCH'])(controller.change_status)
company.route('/companies/<int:id>', methods=['DELETE'])(controller.delete_draft_company)
company.route('/companies', methods=['GET'])(controller.get_company_list)

# Additional endpoints for specific actions
company.route('/companies/draft', methods=['POST'])(controller.create_company_draft)
company.route('/companies/draft/<int:id>', methods=["GET"])(controller.get_company_draft)
company.route('/companies/search', methods=['GET'])(controller.search_company)
company.route('/companies/get/bio', methods=['GET'])(controller.get_company_bio)
company.route('/companies/fetch/data', methods=['GET'])(controller.fetch_company_data)
company.route('/companies/history', methods=['GET'])(controller.get_inferece_list)
company.route('/companies/inference/<int:id>', methods=['GET'])(controller.get_inference_report)
company.route('/companies/difference', methods=['GET'])(controller.difference_with_previous)
company.route('/companies/analytics', methods=['GET'])(controller.get_analytic_data)

# Routes for related resources
company.route('/investors', methods=['GET'])(controller.get_investors)
company.route('/competitors', methods=['GET'])(controller.get_competitors)
company.route('/industries', methods=['GET'])(controller.get_industries)
company.route('/finance-dealtype', methods=['GET'])(controller.get_finance_deal_type)
company.route('/ceo-education', methods=['GET'])(controller.get_ceo_education)
