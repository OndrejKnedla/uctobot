from flask import Flask, request, jsonify
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_database, text, func, and_
import os
import sys
from datetime import datetime, timedelta
import json
from decimal import Decimal

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import get_database_session, engine
from app.database.models import User, Transaction, Payment

app = Flask(__name__)

class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for handling Decimal objects"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(DecimalEncoder, self).default(obj)

@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/api/transactions/stats', methods=['GET'])
def get_transactions_stats():
    """Get overall transaction statistics"""
    try:
        session = get_database_session()
        
        # Total transactions
        total_transactions = session.query(Transaction).count()
        
        # Total income/revenue (sum of income transactions)
        total_income_result = session.query(
            func.sum(Transaction.amount_czk)
        ).filter(Transaction.type == 'income').scalar()
        total_income = float(total_income_result) if total_income_result else 0
        
        # Total expenses
        total_expenses_result = session.query(
            func.sum(Transaction.amount_czk)
        ).filter(Transaction.type == 'expense').scalar()
        total_expenses = float(total_expenses_result) if total_expenses_result else 0
        
        # Transactions by month (last 12 months)
        twelve_months_ago = datetime.now() - timedelta(days=365)
        monthly_stats = session.query(
            func.extract('year', Transaction.transaction_date).label('year'),
            func.extract('month', Transaction.transaction_date).label('month'),
            func.count(Transaction.id).label('count'),
            func.sum(Transaction.amount_czk).label('total')
        ).filter(
            Transaction.transaction_date >= twelve_months_ago
        ).group_by(
            func.extract('year', Transaction.transaction_date),
            func.extract('month', Transaction.transaction_date)
        ).order_by('year', 'month').all()
        
        monthly_data = []
        for stat in monthly_stats:
            monthly_data.append({
                'year': int(stat.year),
                'month': int(stat.month),
                'count': stat.count,
                'total': float(stat.total) if stat.total else 0
            })
        
        # Recent transactions (last 7 days)
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent_transactions = session.query(Transaction).filter(
            Transaction.created_at >= seven_days_ago
        ).count()
        
        # Transactions by type
        income_count = session.query(Transaction).filter(Transaction.type == 'income').count()
        expense_count = session.query(Transaction).filter(Transaction.type == 'expense').count()
        
        # Top categories by transaction count
        top_categories = session.query(
            Transaction.category_name,
            func.count(Transaction.id).label('count'),
            func.sum(Transaction.amount_czk).label('total')
        ).filter(
            Transaction.category_name.isnot(None)
        ).group_by(
            Transaction.category_name
        ).order_by(
            func.count(Transaction.id).desc()
        ).limit(10).all()
        
        categories_data = []
        for category in top_categories:
            categories_data.append({
                'name': category.category_name,
                'count': category.count,
                'total': float(category.total) if category.total else 0
            })
        
        return jsonify({
            'success': True,
            'stats': {
                'total_transactions': total_transactions,
                'total_income': total_income,
                'total_expenses': total_expenses,
                'recent_transactions': recent_transactions,
                'income_count': income_count,
                'expense_count': expense_count,
                'monthly_stats': monthly_data,
                'top_categories': categories_data
            }
        })
        
    except Exception as e:
        print(f"Error in get_transactions_stats: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/transactions', methods=['GET'])
def list_transactions():
    """Get all transactions with filtering and pagination"""
    try:
        session = get_database_session()
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        user_id = request.args.get('user_id')
        transaction_type = request.args.get('type')
        search = request.args.get('search', '')
        
        # Build query
        query = session.query(Transaction)
        
        # Apply filters
        if user_id:
            query = query.filter(Transaction.user_id == int(user_id))
        
        if transaction_type:
            query = query.filter(Transaction.type == transaction_type)
        
        if search:
            query = query.filter(
                Transaction.description.like(f'%{search}%') |
                Transaction.counterparty_name.like(f'%{search}%') |
                Transaction.category_name.like(f'%{search}%')
            )
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination and ordering
        offset = (page - 1) * limit
        transactions = query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()
        
        # Serialize transactions
        transactions_data = []
        for transaction in transactions:
            transactions_data.append({
                'id': transaction.id,
                'user_id': transaction.user_id,
                'type': transaction.type,
                'amount_czk': float(transaction.amount_czk) if transaction.amount_czk else 0,
                'description': transaction.description,
                'category_name': transaction.category_name,
                'counterparty_name': transaction.counterparty_name,
                'counterparty_ico': transaction.counterparty_ico,
                'vat_rate': transaction.vat_rate,
                'vat_amount': float(transaction.vat_amount) if transaction.vat_amount else 0,
                'document_number': transaction.document_number,
                'transaction_date': transaction.transaction_date.isoformat() if transaction.transaction_date else None,
                'created_at': transaction.created_at.isoformat() if transaction.created_at else None,
                'ai_confidence': float(transaction.ai_confidence) if transaction.ai_confidence else None
            })
        
        return jsonify({
            'success': True,
            'transactions': transactions_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'total_pages': (total_count + limit - 1) // limit
            }
        })
        
    except Exception as e:
        print(f"Error in list_transactions: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/transactions/<int:transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    """Get specific transaction by ID"""
    try:
        session = get_database_session()
        
        transaction = session.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction:
            return jsonify({'success': False, 'error': 'Transaction not found'}), 404
        
        # Get user info
        user = session.query(User).filter(User.id == transaction.user_id).first()
        
        transaction_data = {
            'id': transaction.id,
            'user_id': transaction.user_id,
            'user': {
                'full_name': user.full_name if user else None,
                'email': user.email if user else None
            },
            'type': transaction.type,
            'amount_czk': float(transaction.amount_czk) if transaction.amount_czk else 0,
            'original_amount': float(transaction.original_amount) if transaction.original_amount else None,
            'original_currency': transaction.original_currency,
            'description': transaction.description,
            'category_code': transaction.category_code,
            'category_name': transaction.category_name,
            'counterparty_name': transaction.counterparty_name,
            'counterparty_ico': transaction.counterparty_ico,
            'counterparty_dic': transaction.counterparty_dic,
            'counterparty_address': transaction.counterparty_address,
            'vat_rate': transaction.vat_rate,
            'vat_base': float(transaction.vat_base) if transaction.vat_base else 0,
            'vat_amount': float(transaction.vat_amount) if transaction.vat_amount else 0,
            'document_number': transaction.document_number,
            'document_date': transaction.document_date.isoformat() if transaction.document_date else None,
            'payment_date': transaction.payment_date.isoformat() if transaction.payment_date else None,
            'payment_method': transaction.payment_method,
            'original_message': transaction.original_message,
            'ai_confidence': float(transaction.ai_confidence) if transaction.ai_confidence else None,
            'transaction_date': transaction.transaction_date.isoformat() if transaction.transaction_date else None,
            'created_at': transaction.created_at.isoformat() if transaction.created_at else None,
            'updated_at': transaction.updated_at.isoformat() if transaction.updated_at else None
        }
        
        return jsonify({
            'success': True,
            'transaction': transaction_data
        })
        
    except Exception as e:
        print(f"Error in get_transaction: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/transactions/recent', methods=['GET'])
def get_recent_transactions():
    """Get recent transactions for dashboard"""
    try:
        session = get_database_session()
        
        limit = int(request.args.get('limit', 20))
        
        # Get recent transactions
        transactions = session.query(Transaction).order_by(Transaction.created_at.desc()).limit(limit).all()
        
        transactions_data = []
        for transaction in transactions:
            # Get user info
            user = session.query(User).filter(User.id == transaction.user_id).first()
            
            transactions_data.append({
                'id': transaction.id,
                'user_id': transaction.user_id,
                'user_name': user.full_name if user else 'Unknown',
                'type': transaction.type,
                'amount_czk': float(transaction.amount_czk) if transaction.amount_czk else 0,
                'description': transaction.description,
                'category_name': transaction.category_name,
                'created_at': transaction.created_at.isoformat() if transaction.created_at else None
            })
        
        return jsonify({
            'success': True,
            'transactions': transactions_data
        })
        
    except Exception as e:
        print(f"Error in get_recent_transactions: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

# For Vercel deployment
if __name__ == '__main__':
    app.run(debug=True)