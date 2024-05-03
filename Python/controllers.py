from flask_jwt_extended import (
    jwt_required,
)
from flask import request
from apps.company.serializers import Serializer, External_Serializers
from flasgger import swag_from
import logging

logger = logging.getLogger(__name__)


class Controller:
    @jwt_required()
    @swag_from('./swagger/get_competitors.yml')
    def get_competitors(self):
        logger.debug(f"start get_competitors.")
        serializer = External_Serializers()
        competitors = serializer.get_competitors()
        logger.debug(f"finished get_competitors.")
        return competitors

    @jwt_required()
    @swag_from('./swagger/get_investors.yml')
    def get_investors(self):
        logger.debug(f"start get_investors.")
        serializer = External_Serializers()
        investors = serializer.get_investors()
        logger.debug(f"finished get_investors.")
        return investors

    @jwt_required()
    @swag_from('./swagger/create_company.yml')
    def create_company(self):
        logger.debug(f"start create_company.")
        data = request.get_json()
        serializer = Serializer()
        response = serializer.create_company(data)
        logger.debug(f"start create_company.")
        return response

    @jwt_required()
    @swag_from('./swagger/create_company_draft.yml')
    def create_company_draft(self):
        logger.debug(f"start create_company_draft.")
        data = request.get_json()
        serializer = Serializer()
        response = serializer.create_company_draft(data)
        logger.debug(f"start create_company_draft.")
        return response

    @jwt_required()
    @swag_from('./swagger/get_industries.yml')
    def get_industries(self):
        logger.debug(f"start get_industries.")
        serializer = Serializer()
        response = serializer.get_industries()
        logger.debug(f"finished get_industries.")
        return response

    @jwt_required()
    @swag_from('./swagger/get_finance_deal_type.yml')
    def get_finance_deal_type(self):
        logger.debug(f"start get_industries.")
        serializer = Serializer()
        response = serializer.get_finance_deal_type()
        logger.debug(f"start get_industries.")
        return response

    @jwt_required()
    @swag_from('./swagger/get_ceo_education.yml')
    def get_ceo_education(self):
        logger.debug(f"start get_ceo_education.")
        serializer = Serializer()
        response = serializer.get_ceo_education()
        logger.debug(f"finished get_ceo_education.")
        return response

    @jwt_required()
    @swag_from('./swagger/search_company.yml')
    def search_company(self):
        logger.debug(f"start search_company.")
        serializer = External_Serializers()
        companies = serializer.search_company()
        logger.debug(f"finished search_company.")
        return companies


    @jwt_required()
    @swag_from('./swagger/get_company_bio.yml')
    def get_company_bio(self):
        logger.debug(f"start get_company_bio.")
        serializer = External_Serializers()
        companies = serializer.get_company_bio()
        logger.debug(f"finished get_company_bio.")
        return companies


    @jwt_required()
    @swag_from('./swagger/fetch_company_data.yml')
    def fetch_company_data(self):
        logger.debug(f"start fetch_company_data.")
        serializer = External_Serializers()
        company_data = serializer.fetch_company_data()
        logger.debug(f"finished fetch_company_data.")
        return company_data

    @jwt_required()
    @swag_from('./swagger/change_status.yml')
    def change_status(self, id):
        logger.debug(f"start change_status.")
        data = request.get_json()
        serializer = Serializer()
        company_data = serializer.change_status(id, data)
        logger.debug(f"finished fetch_company_data.")
        return company_data

    @jwt_required()
    @swag_from('./swagger/get_company_list.yml')
    def get_company_list(self,):
        logger.debug(f"start get_company_list.")
        serializer = Serializer()
        company_data = serializer.get_company_list()
        logger.debug(f"finished get_company_list.")
        return company_data

    @jwt_required()
    @swag_from('./swagger/get_company_draft.yml')
    def get_company_draft(self, id):
        logger.debug(f"start get_company.")
        serializer = Serializer()
        company_data = serializer.get_company_draft(id)
        logger.debug(f"finished get_company.")
        return company_data

    @jwt_required()
    @swag_from('./swagger/get_inferece_list.yml')
    def get_inferece_list(self):
        logger.debug(f"start get_inference_list.")
        serializer = Serializer()
        company_data = serializer.inference_report_history()
        logger.debug(f"finished get_inference_list.")
        return company_data

    @jwt_required()
    @swag_from('./swagger/delete_draft_company.yml')
    def delete_draft_company(self, id):
        logger.debug(f"start delete_draft_company.")
        serializer = Serializer()
        company_data = serializer.delete_draft_company(id)
        logger.debug(f"finished delete_draft_company.")
        return company_data

    @jwt_required()
    @swag_from('./swagger/get_inference_report.yml')
    def get_inference_report(self, id):
        logger.debug(f"start get_inference_report.")
        serializer = Serializer()
        company_data = serializer.get_inference_report(id)
        logger.debug(f"finished get_inference_report.")
        return company_data

    @jwt_required()
    @swag_from('./swagger/get_company.yml')
    def get_company(self, id):
        logger.debug(f"start get_company.")
        serializer = Serializer()
        company_data = serializer.get_company(id)
        logger.debug(f"finished get_company.")
        return company_data

    @jwt_required()
    @swag_from('./swagger/difference_with_previous.yml')
    def difference_with_previous(self):
        logger.debug(f"start difference_with_previous.")
        serializer = Serializer()
        company_data = serializer.difference_with_previous()
        logger.debug(f"finished difference_with_previous.")
        return company_data

    @jwt_required()
    @swag_from('./swagger/get_analytic_data.yml')
    def get_analytic_data(self):
        logger.debug(f"start get_analytic_data.")
        serializer = External_Serializers()
        company_data = serializer.get_analytic_data()
        logger.debug(f"finished get_analytic_data.")
        return company_data


