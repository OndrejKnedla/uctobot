from flask import Flask, request, jsonify
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_database, text, func
import os
import sys
from datetime import datetime, timedelta
import json
from decimal import Decimal

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import get_database_session, engine
from app.database.models import User, Payment, Transaction, UserSettings

app = Flask(__name__)

class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for handling Decimal objects"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(DecimalEncoder, self).default(obj)

def serialize_user(user):
    """Serialize user object to JSON"""
    if not user:
        return None
    
    return {
        'id': user.id,
        'email': user.email,
        'phone': user.phone,
        'whatsapp_number': user.whatsapp_number,
        'profile_name': user.profile_name,
        'full_name': user.full_name,
        'business_name': user.business_name,
        'ico': user.ico,
        'dic': user.dic,
        'vat_payer': user.vat_payer,
        'subscription_status': user.subscription_status,
        'subscription_plan': user.subscription_plan,
        'trial_ends_at': user.trial_ends_at.isoformat() if user.trial_ends_at else None,
        'subscription_ends_at': user.subscription_ends_at.isoformat() if user.subscription_ends_at else None,
        'whatsapp_activated': user.whatsapp_activated,
        'activation_token': user.activation_token,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'updated_at': user.updated_at.isoformat() if user.updated_at else None,
        'last_activity': user.last_activity.isoformat() if user.last_activity else None,
        'stripe_customer_id': user.stripe_customer_id,
        'stripe_subscription_id': user.stripe_subscription_id
    }

@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/api/users', methods=['GET'])
def list_users():
    """Get all users with pagination and filtering"""
    try:
        session = get_database_session()
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        
        # Build query
        query = session.query(User)
        
        # Apply filters
        if search:
            query = query.filter(
                User.email.like(f'%{search}%') |
                User.full_name.like(f'%{search}%') |
                User.business_name.like(f'%{search}%') |
                User.phone.like(f'%{search}%')
            )
        
        if status:
            query = query.filter(User.subscription_status == status)
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        users = query.offset(offset).limit(limit).all()
        
        return jsonify({
            'success': True,
            'users': [serialize_user(user) for user in users],
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'total_pages': (total_count + limit - 1) // limit
            }
        })
        
    except Exception as e:
        print(f"Error in list_users: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get specific user by ID"""
    try:
        session = get_database_session()
        user = session.query(User).filter(User.id == user_id).first()
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get additional stats
        payments_count = session.query(Payment).filter(Payment.user_id == user_id).count()
        transactions_count = session.query(Transaction).filter(Transaction.user_id == user_id).count()
        
        user_data = serialize_user(user)
        user_data['stats'] = {
            'payments_count': payments_count,
            'transactions_count': transactions_count
        }
        
        return jsonify({
            'success': True,
            'user': user_data
        })
        
    except Exception as e:
        print(f"Error in get_user: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/users/<int:user_id>/payments', methods=['GET'])
def get_user_payments(user_id):
    """Get payments for specific user"""
    try:
        session = get_database_session()
        
        # Check if user exists
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        payments = session.query(Payment).filter(Payment.user_id == user_id).order_by(Payment.created_at.desc()).all()
        
        payments_data = []
        for payment in payments:
            payments_data.append({
                'id': payment.id,
                'payment_id': payment.payment_id,
                'amount': float(payment.amount) if payment.amount else 0,
                'currency': payment.currency,
                'status': payment.status,
                'provider': payment.provider,
                'payment_method': payment.payment_method,
                'created_at': payment.created_at.isoformat() if payment.created_at else None,
                'completed_at': payment.completed_at.isoformat() if payment.completed_at else None
            })
        
        return jsonify({
            'success': True,
            'payments': payments_data
        })
        
    except Exception as e:
        print(f"Error in get_user_payments: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/users/<int:user_id>/transactions', methods=['GET'])
def get_user_transactions(user_id):
    """Get transactions for specific user"""
    try:
        session = get_database_session()
        
        # Check if user exists
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get query parameters
        limit = int(request.args.get('limit', 100))
        
        transactions = session.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.created_at.desc()).limit(limit).all()
        
        transactions_data = []
        for transaction in transactions:
            transactions_data.append({
                'id': transaction.id,
                'type': transaction.type,
                'amount_czk': float(transaction.amount_czk) if transaction.amount_czk else 0,
                'description': transaction.description,
                'category_name': transaction.category_name,
                'counterparty_name': transaction.counterparty_name,
                'vat_rate': transaction.vat_rate,
                'created_at': transaction.created_at.isoformat() if transaction.created_at else None,
                'transaction_date': transaction.transaction_date.isoformat() if transaction.transaction_date else None
            })
        
        return jsonify({
            'success': True,
            'transactions': transactions_data
        })
        
    except Exception as e:
        print(f"Error in get_user_transactions: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/users/stats', methods=['GET'])
def get_users_stats():
    """Get overall user statistics"""
    try:
        session = get_database_session()
        
        # Get counts by subscription status
        stats = session.query(
            User.subscription_status, 
            func.count(User.id).label('count')
        ).group_by(User.subscription_status).all()
        
        # Calculate totals
        total_users = session.query(User).count()
        active_users = session.query(User).filter(
            User.subscription_status.in_(['trial', 'active'])
        ).count()
        
        # Recent registrations (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_registrations = session.query(User).filter(
            User.created_at >= thirty_days_ago
        ).count()
        
        # Users with WhatsApp activated
        whatsapp_activated = session.query(User).filter(
            User.whatsapp_activated == True
        ).count()
        
        stats_dict = {stat.subscription_status or 'unknown': stat.count for stat in stats}
        
        return jsonify({
            'success': True,
            'stats': {
                'total_users': total_users,
                'active_users': active_users,
                'recent_registrations': recent_registrations,
                'whatsapp_activated': whatsapp_activated,
                'by_status': stats_dict
            }
        })
        
    except Exception as e:
        print(f"Error in get_users_stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user information"""
    try:
        session = get_database_session()
        
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = [
            'email', 'full_name', 'business_name', 'ico', 'dic', 
            'subscription_status', 'subscription_plan', 'vat_payer'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        user.updated_at = datetime.now()
        session.commit()
        
        return jsonify({
            'success': True,
            'user': serialize_user(user)
        })
        
    except Exception as e:
        print(f"Error in update_user: {e}")
        session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/users/<int:user_id>/activate', methods=['POST'])
def activate_user_subscription(user_id):
    """Manually activate user subscription (admin function)"""
    try:
        session = get_database_session()
        
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        data = request.get_json()
        subscription_plan = data.get('subscription_plan', 'monthly')
        duration_months = 12 if subscription_plan == 'yearly' else 1
        
        # Set subscription active
        user.subscription_status = 'active'
        user.subscription_plan = subscription_plan
        user.subscription_ends_at = datetime.now() + timedelta(days=duration_months * 30)
        user.updated_at = datetime.now()
        
        session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User subscription activated',
            'user': serialize_user(user)
        })
        
    except Exception as e:
        print(f"Error in activate_user_subscription: {e}")
        session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user (admin function)"""
    try:
        session = get_database_session()
        
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # For safety, don't actually delete, just mark as cancelled
        user.subscription_status = 'cancelled'
        user.updated_at = datetime.now()
        session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User subscription cancelled'
        })
        
    except Exception as e:
        print(f"Error in delete_user: {e}")
        session.rollback()
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