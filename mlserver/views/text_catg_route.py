from flask import Blueprint, request, jsonify

import controllers.text_catg_ctr as text_catg_ctr
import controllers.text_subcatg_ctr as text_subcatg_ctr

api_routes_text_catg = Blueprint("api_routes_text_catg", __name__)

@api_routes_text_catg.route("/text_category", methods=["POST"])
def text_category():
    try:
        data = request.json
        if not data or 'complaint' not in data:
            return jsonify({"error": "Complaint text is required"}), 400
        
        complaint = data['complaint']
        category = text_catg_ctr.predict_category(complaint)
        return jsonify({"category": category}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@api_routes_text_catg.route("/text_subcategory", methods = ["POST"])
def text_subcategory():
    '''
    Request Body:
    {
        "description": "Issue description",
        "category": "Main category"
    }
    '''
    data = request.get_json()
    if not data or "description" not in data or "category" not in data:
        return jsonify({"error": "Invalid request. Please provide 'description' and 'category'."}), 400

    description = data["description"]
    category = data["category"]
    
    # Call the prediction function
    predicted_subcategory = text_subcatg_ctr.predict_subcategory(description, category)
    return jsonify({"subcategory": predicted_subcategory})