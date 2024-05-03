from urllib.parse import urlparse, parse_qs
from flask import request, jsonify


class Serializer:
    ml_api_for_competitors = Config.ML_API + 'competitors'
    ml_api_for_investors = Config.ML_API + 'investors'
    ml_api_for_company_dashboard = Config.ML_API + 'company_dashboard'
    ml_api_for_nasdaq_features = Config.ML_API + 'nasdaq_features'

    def get_query_params(self) -> dict:
        """Extract query parameters from the request URL."""
        parsed_url = urlparse(request.url)
        query_params = parse_qs(parsed_url.query)
        return query_params

    def get_data_from_table(self, table) -> list:
        """Retrieve data from a database table."""
        table_names = db.session.query(table.name, table.id).all()
        return [{'name': name[0], 'id': name[1]} for name in table_names]

    def get_industries(self) -> jsonify:
        """Retrieve industries and return as JSON."""
        industry_names_list = self.get_data_from_table(Industry)
        return jsonify(industry_names_list)

    def get_finance_deal_type(self) -> jsonify:
        """Retrieve finance deal types and return as JSON."""
        deal_types_name_list = self.get_data_from_table(DealType)
        return jsonify(deal_types_name_list)

    def get_ceo_education(self) -> jsonify:
        """Retrieve CEO education data and return as JSON."""
        ceo_education_list = self.get_data_from_table(Ceo_Education)
        return jsonify(ceo_education_list)

    def get_company_draft(self, id: int) -> jsonify:
        """Retrieve a company's draft data by ID."""
        company = Company.get_company_by_id(id)
        if company:
            if company.status != "draft":
                return jsonify({'status': 'error', 'details': "company status should be draft", "data": "Internal error"}), 400
            result = Company.get_company_dict(company)
            if company.uuid:
                result['uuid'] = company.uuid
            return jsonify(result)
        else:
            return jsonify({'status': 'error', 'details': 'Company not found', "data": "Internal error"}), 400

    def get_company_list(self) -> jsonify:
        """Retrieve a list of companies."""
        try:
            status = request.args.get('status')
            if not status:
                return jsonify({'error': 'status is required'}), 400
            elif status.lower() not in ("draft", "in_progress", "closed", "rejected", "closed,rejected"):
                return jsonify({'error': 'status should be draft, in_progress, closed, or rejected'}), 400

            company_name = request.args.get('name')
            per_page = request.args.get('perPage', default=10, type=int)
            page = request.args.get('pageNum', default=1, type=int)

            offset = (page - 1) * per_page
            results, total = Company.get_list(company_name, status, offset, per_page)
            return jsonify({"results": results, "total": total, "perPage": per_page, "pageNum": page})

        except Exception as e:
            logger.error(e)
            return jsonify(str(e)), 500
