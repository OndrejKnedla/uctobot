from flask import Flask, request, jsonify, make_response
import json
import os
import sys

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Create Flask app
app = Flask(__name__)

# Import API modules
try:
    from users import app as users_app
    from transactions import app as transactions_app
    print("API modules imported successfully")
except ImportError as e:
    print(f"Warning: Could not import API modules: {e}")

@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/', methods=['GET'])
def home():
    """Landing page with redirect"""
    html = '''<!DOCTYPE html>
<html>
<head>
    <title>ÚčtoBot</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 40px 20px; 
            background: linear-gradient(135deg, #25D366, #128C7E); 
            color: white; 
            text-align: center; 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }
        .container { 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px); 
        }
        h1 { font-size: 3rem; margin-bottom: 20px; }
        p { font-size: 1.3rem; margin-bottom: 30px; }
        .btn { 
            background: white; 
            color: #25D366; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold; 
            font-size: 1.1rem; 
        }
    </style>
    <meta http-equiv="refresh" content="3;url=https://uctobot-git-master-realok2001-gmailcoms-projects.vercel.app">
</head>
<body>
    <div class="container">
        <h1>🤖 ÚčtoBot</h1>
        <p>Účetnictví pro OSVČ přes WhatsApp</p>
        <p>Přesměrovávám na aplikaci...</p>
        <a href="https://uctobot-git-master-realok2001-gmailcoms-projects.vercel.app" class="btn">Pokračovat</a>
    </div>
</body>
</html>'''
    return html

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "message": "ÚčtoBot API", 
        "status": "healthy", 
        "version": "1.0.0"
    })

@app.route('/api/test', methods=['GET', 'POST', 'OPTIONS'])
def test():
    """Test endpoint for debugging"""
    print(f"DEBUG: {request.method} request to /api/test")
    print(f"DEBUG: Headers: {dict(request.headers)}")
    
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS OK'})
    
    response_data = {
        "message": f"Test {request.method} works!",
        "method": request.method,
        "path": request.path,
        "headers": dict(request.headers)
    }
    
    if request.method == 'POST':
        try:
            data = request.get_json()
            response_data["received_data"] = data
            print(f"DEBUG: POST data: {data}")
        except Exception as e:
            response_data["json_error"] = str(e)
    
    return jsonify(response_data)

@app.route('/api/payments/create-checkout-session', methods=['POST', 'OPTIONS'])
def create_checkout_session():
    """Handle payment checkout session creation"""
    
    print(f"DEBUG: {request.method} request to /api/payments/create-checkout-session")
    print(f"DEBUG: Request headers: {dict(request.headers)}")
    
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight OK'})
    
    try:
        # Get request data
        request_data = request.get_json() or {}
        print(f"DEBUG: Request data: {request_data}")
        
        plan_type = request_data.get('plan_type', 'monthly')
        trial_days = request_data.get('trial_days', 7)
        user_email = request_data.get('email')
        user_name = request_data.get('name')
        
        print(f"DEBUG: Processing payment for plan_type='{plan_type}', trial_days={trial_days}")
        
        # Create or update user in database
        if user_email:
            try:
                # Add parent directory to path for database imports
                sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                
                from app.database.connection import get_database_session
                from app.database.models import User, Payment
                from datetime import datetime, timedelta
                import secrets
                
                session = get_database_session()
                
                # Find or create user
                user = session.query(User).filter(User.email == user_email).first()
                if not user:
                    user = User(
                        email=user_email,
                        full_name=user_name,
                        subscription_status='trial',
                        trial_ends_at=datetime.now() + timedelta(days=trial_days),
                        created_at=datetime.now()
                    )
                    # Create activation token
                    user.create_activation_token()
                    session.add(user)
                    session.flush()  # Get the user ID
                
                # Create payment record
                payment_id = f"demo_{plan_type}_{secrets.token_hex(8)}"
                amount = 2990 if plan_type == 'yearly' else 299
                
                payment = Payment(
                    user_id=user.id,
                    payment_id=payment_id,
                    amount=amount,
                    currency='czk',
                    status='pending',
                    provider='demo',
                    payment_method='demo',
                    payment_metadata={
                        'plan_type': plan_type,
                        'trial_days': trial_days,
                        'demo': True
                    }
                )
                session.add(payment)
                session.commit()
                
                print(f"DEBUG: Created user {user.id} and payment {payment.id}")
                
            except Exception as db_error:
                print(f"DEBUG: Database error: {db_error}")
                if 'session' in locals():
                    session.rollback()
                    session.close()
        
        # Mock Stripe response for production demo
        response = {
            "success": True,
            "checkout_url": f"https://buy.stripe.com/test_mock_{plan_type}_{trial_days}days",
            "session_id": f"cs_test_{plan_type}_123",
            "plan_type": plan_type,
            "trial_days": trial_days,
            "message": "Demo checkout session created"
        }
        
        print(f"DEBUG: Returning response: {response}")
        return jsonify(response)
        
    except Exception as e:
        print(f"DEBUG: Error in payment handler: {e}")
        import traceback
        traceback.print_exc()
        
        error_response = {"success": False, "error": str(e)}
        return jsonify(error_response), 500

# Add new API endpoints for user and subscription management
@app.route('/api/users/stats', methods=['GET'])
def users_stats():
    """Get user statistics"""
    try:
        # Add parent directory to path for database imports
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        from app.database.connection import get_database_session
        from app.database.models import User, Payment, Transaction
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        session = get_database_session()
        
        # Total users
        total_users = session.query(User).count()
        
        # Active users (trial + active subscription)
        active_users = session.query(User).filter(
            User.subscription_status.in_(['trial', 'active'])
        ).count()
        
        # Recent registrations (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_registrations = session.query(User).filter(
            User.created_at >= thirty_days_ago
        ).count()
        
        return jsonify({
            'success': True,
            'total_users': total_users,
            'active_users': active_users,
            'recent_registrations': recent_registrations
        })
        
    except Exception as e:
        print(f"Error in users_stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/transactions/stats', methods=['GET'])
def transactions_stats():
    """Get transaction statistics"""
    try:
        # Add parent directory to path for database imports
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        from app.database.connection import get_database_session
        from app.database.models import Transaction
        from sqlalchemy import func
        
        session = get_database_session()
        
        # Total transactions
        total_transactions = session.query(Transaction).count()
        
        # Total income
        total_income_result = session.query(
            func.sum(Transaction.amount_czk)
        ).filter(Transaction.type == 'income').scalar()
        total_income = float(total_income_result) if total_income_result else 0
        
        return jsonify({
            'success': True,
            'total_transactions': total_transactions,
            'total_income': total_income
        })
        
    except Exception as e:
        print(f"Error in transactions_stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    """Get combined dashboard statistics"""
    try:
        # Add parent directory to path for database imports
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        from app.database.connection import get_database_session
        from app.database.models import User, Transaction, Payment
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        session = get_database_session()
        
        # Users stats
        total_users = session.query(User).count()
        active_users = session.query(User).filter(
            User.subscription_status.in_(['trial', 'active'])
        ).count()
        
        # Transactions stats
        total_transactions = session.query(Transaction).count()
        total_income_result = session.query(
            func.sum(Transaction.amount_czk)
        ).filter(Transaction.type == 'income').scalar()
        total_income = float(total_income_result) if total_income_result else 0
        
        # Recent activity (last 7 days)
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent_transactions = session.query(Transaction).filter(
            Transaction.created_at >= seven_days_ago
        ).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'users': {
                    'total': total_users,
                    'active': active_users
                },
                'transactions': {
                    'total': total_transactions,
                    'recent': recent_transactions
                },
                'revenue': {
                    'total_income': total_income
                }
            }
        })
        
    except Exception as e:
        print(f"Error in dashboard_stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/payments/webhook', methods=['POST'])
def payment_webhook():
    """Handle payment provider webhooks"""
    try:
        data = request.get_json()
        print(f"DEBUG: Payment webhook received: {data}")
        
        # Add parent directory to path for database imports
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        from app.database.connection import get_database_session
        from app.database.models import User, Payment
        from datetime import datetime, timedelta
        
        session = get_database_session()
        
        # Handle different webhook types
        webhook_type = data.get('type', '')
        payment_id = data.get('payment_id', '')
        
        if webhook_type == 'payment.completed' and payment_id:
            # Find payment in database
            payment = session.query(Payment).filter(Payment.payment_id == payment_id).first()
            if payment:
                # Update payment status
                payment.status = 'completed'
                payment.completed_at = datetime.now()
                
                # Update user subscription
                user = session.query(User).filter(User.id == payment.user_id).first()
                if user:
                    user.subscription_status = 'active'
                    
                    # Set subscription end date based on plan
                    metadata = payment.payment_metadata or {}
                    plan_type = metadata.get('plan_type', 'monthly')
                    duration_months = 12 if plan_type == 'yearly' else 1
                    
                    user.subscription_plan = plan_type
                    user.subscription_ends_at = datetime.now() + timedelta(days=duration_months * 30)
                    user.updated_at = datetime.now()
                
                session.commit()
                print(f"DEBUG: Payment {payment_id} completed, user {user.id if user else 'unknown'} activated")
        
        return jsonify({'success': True, 'received': True})
        
    except Exception as e:
        print(f"DEBUG: Error in payment webhook: {e}")
        if 'session' in locals():
            session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/payments/success', methods=['GET', 'POST'])
def payment_success():
    """Handle successful payment redirects"""
    try:
        session_id = request.args.get('session_id') or (request.get_json() or {}).get('session_id')
        
        if session_id:
            # Add parent directory to path for database imports
            sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            
            from app.database.connection import get_database_session
            from app.database.models import Payment
            
            db_session = get_database_session()
            
            # For demo, mark payment as completed if it contains session_id
            payment = db_session.query(Payment).filter(
                Payment.payment_id.like(f"%{session_id.replace('cs_test_', '')}%")
            ).first()
            
            if payment and payment.status == 'pending':
                payment.status = 'completed'
                payment.completed_at = datetime.now()
                db_session.commit()
                print(f"DEBUG: Payment marked as completed via success callback")
            
            db_session.close()
        
        return jsonify({
            'success': True,
            'message': 'Payment successful',
            'redirect_url': 'https://uctobot-git-master-realok2001-gmailcoms-projects.vercel.app/platba-uspesna'
        })
        
    except Exception as e:
        print(f"DEBUG: Error in payment success: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "error": "Endpoint not found", 
        "path": request.path,
        "method": request.method
    }), 404

# Export the Flask app for Vercel
# Vercel will automatically detect the 'app' variable as WSGI application
if __name__ == '__main__':
    app.run(debug=True)