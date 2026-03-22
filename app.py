# -*- coding: utf-8 -*-
"""AQUAMED SYSTEM - COMPLETE WITH PROFILE FEATURES"""

import os
import io
import json
import sqlite3
import uuid
import datetime
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import tensorflow as tf
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# --- 1. Initialize Flask App ---
app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = "your_super_secret_key_change_this_in_production"
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

CORS(app, supports_credentials=True)

# --- 2. Database & Storage Configuration ---
DB_NAME = "aquamed_data.db"
UPLOAD_FOLDER = "collected_images"
JSON_KB_FILE = 'diseases.json'
MODEL_FILE = 'fish_disease_final_cnn_acc_92.keras'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# ==========================================
# DATABASE HELPER FUNCTIONS
# ==========================================

def get_table_columns(table_name):
    """Get list of columns in a table"""
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [col[1] for col in cursor.fetchall()]
        conn.close()
        return columns
    except:
        return []

def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    return column_name in get_table_columns(table_name)

# ==========================================
# DATABASE SETUP - BACKWARD COMPATIBLE
# ==========================================

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Check if users table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    table_exists = cursor.fetchone()

    if not table_exists:
        # Create new table with minimal structure
        cursor.execute('''
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print(" [DB] Created new users table")
    else:
        # Check existing structure
        columns = get_table_columns('users')
        print(f" [DB] Existing table structure: {', '.join(columns)}")

    # Logs Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS disease_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            filename TEXT NOT NULL,
            predicted_disease TEXT,
            confidence REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print(" [DB] Database initialized.")

init_db()

# ==========================================
# AUTHENTICATION API ENDPOINTS
# ==========================================

@app.route('/api/register', methods=['POST'])
def register_api():
    """Register - works with any database structure"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided', 'status': 400}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        # Validation
        if not username or not password:
            return jsonify({
                'error': 'Username and password are required',
                'status': 400
            }), 400
        
        if len(username) < 3 or len(username) > 50:
            return jsonify({
                'error': 'Username must be between 3 and 50 characters',
                'status': 400
            }), 400
        
        if len(password) < 6:
            return jsonify({
                'error': 'Password must be at least 6 characters long',
                'status': 400
            }), 400
        
        # Hash password
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                (username, hashed_password)
            )
            conn.commit()
            
            print(f" [REGISTER] New user created: {username}")
            
            return jsonify({
                'message': 'User registered successfully!',
                'username': username,
                'status': 201
            }), 201
            
        except sqlite3.IntegrityError:
            return jsonify({
                'error': 'Username already exists. Please choose another.',
                'status': 409
            }), 409
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f" [REGISTER ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Registration failed. Please try again.',
            'status': 500
        }), 500


@app.route('/api/login', methods=['POST'])
def login_api():
    """ Login - now returns created_at for profile"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided', 'status': 400}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({
                'error': 'Username and password are required',
                'status': 400
            }), 400
        
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        try:
            #  Get created_at if available
            columns = get_table_columns('users')
            select_cols = 'id, username, password'
            if 'created_at' in columns:
                select_cols += ', created_at'
            
            cursor.execute(
                f"SELECT {select_cols} FROM users WHERE username = ?",
                (username,)
            )
            user = cursor.fetchone()
            
            if not user:
                print(f"  [LOGIN] User not found: {username}")
                return jsonify({
                    'error': 'Invalid username or password',
                    'status': 401
                }), 401
            
            user_id = user[0]
            db_username = user[1]
            hashed_password = user[2]
            created_at = user[3] if len(user) > 3 else None
            
            # Verify password
            if check_password_hash(hashed_password, password):
                #  Update last_login if column exists
                if column_exists('users', 'last_login'):
                    try:
                        cursor.execute(
                            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
                            (user_id,)
                        )
                        conn.commit()
                    except:
                        pass
                
                # Create session
                session['user_id'] = user_id
                session['username'] = db_username
                session['logged_in'] = True
                
                print(f" [LOGIN] Successful login: {db_username}")
                
                response_data = {
                    'message': 'Login successful!',
                    'username': db_username,
                    'user_id': user_id,
                    'status': 200
                }
                
                if created_at:
                    response_data['created_at'] = created_at
                
                return jsonify(response_data), 200
            else:
                print(f"  [LOGIN] Invalid password for user: {username}")
                return jsonify({
                    'error': 'Invalid username or password',
                    'status': 401
                }), 401
                
        finally:
            conn.close()
            
    except Exception as e:
        print(f" [LOGIN ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Login failed. Please try again.',
            'status': 500
        }), 500


@app.route('/api/logout', methods=['POST', 'GET'])
def logout_api():
    """Logout endpoint"""
    try:
        username = session.get('username', 'Unknown')
        session.clear()
        print(f" [LOGOUT] User logged out: {username}")
        return jsonify({'message': 'Logout successful!', 'status': 200}), 200
    except Exception as e:
        return jsonify({'error': 'Logout failed', 'status': 500}), 500


@app.route('/api/session')
def check_session():
    """Check if user is logged in"""
    if session.get('logged_in'):
        return jsonify({
            'logged_in': True,
            'username': session.get('username'),
            'user_id': session.get('user_id'),
            'status': 200
        }), 200
    else:
        return jsonify({'logged_in': False, 'status': 200}), 200


# ==========================================
#  NEW: PROFILE ENDPOINTS
# ==========================================

@app.route('/api/profile/info', methods=['GET'])
def get_profile_info():
    """Get user profile information"""
    try:
        username = request.args.get('username')
        
        if not username:
            return jsonify({'error': 'Username required'}), 400
        
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Get available columns
        columns = get_table_columns('users')
        select_cols = ['id', 'username']
        if 'created_at' in columns:
            select_cols.append('created_at')
        
        query = f"SELECT {', '.join(select_cols)} FROM users WHERE username = ?"
        cursor.execute(query, (username,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        result = {
            'user_id': user[0],
            'username': user[1]
        }
        
        if len(user) > 2:
            result['created_at'] = user[2]
        
        conn.close()
        return jsonify(result), 200
        
    except Exception as e:
        print(f" [PROFILE INFO ERROR] {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/profile/update', methods=['POST'])
def update_profile():
    """ Update user profile (password change)"""
    try:
        data = request.get_json()
        
        username = data.get('username')
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not username or not current_password or not new_password:
            return jsonify({
                'error': 'Username, current password, and new password are required',
                'status': 400
            }), 400
        
        if len(new_password) < 6:
            return jsonify({
                'error': 'New password must be at least 6 characters long',
                'status': 400
            }), 400
        
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        try:
            # Verify current password
            cursor.execute(
                "SELECT id, password FROM users WHERE username = ?",
                (username,)
            )
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'User not found', 'status': 404}), 404
            
            user_id, stored_password = user
            
            if not check_password_hash(stored_password, current_password):
                return jsonify({
                    'error': 'Current password is incorrect',
                    'status': 401
                }), 401
            
            # Update to new password
            new_hashed = generate_password_hash(new_password, method='pbkdf2:sha256')
            cursor.execute(
                "UPDATE users SET password = ? WHERE id = ?",
                (new_hashed, user_id)
            )
            conn.commit()
            
            print(f" [PROFILE] Password updated for: {username}")
            
            return jsonify({
                'message': 'Password updated successfully!',
                'status': 200
            }), 200
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f" [PROFILE UPDATE ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to update profile',
            'status': 500
        }), 500


@app.route('/api/test-auth', methods=['GET'])
def test_auth():
    """Test endpoint"""
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        table_exists = cursor.fetchone()
        
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        columns = get_table_columns('users')
        column_list = ', '.join(columns[:3])
        cursor.execute(f"SELECT {column_list} FROM users")
        users = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'database': DB_NAME,
            'table_exists': bool(table_exists),
            'table_columns': columns,
            'total_users': user_count,
            'users': [
                {columns[i]: u[i] for i in range(len(u))} for u in users
            ],
            'status': 200
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e), 'status': 500}), 500


# ==========================================
# IMAGE MODEL & KNOWLEDGE BASE
# ==========================================

DISEASE_LABELS = ['finrot', 'healthy', 'holeinhead', 'popeye', 'whitespot']

KNOWLEDGE_BASE = {
    'finrot': {'display_name': 'Fin Rot', 'medication_page': '/medication/fin-rot'},
    'holeinhead': {'display_name': 'Hole in the Head', 'medication_page': '/medication/hole-in-the-head'},
    'popeye': {'display_name': 'Pop Eye', 'medication_page': '/medication/pop-eye'},
    'whitespot': {'display_name': 'White Spots (Ich)', 'medication_page': '/medication/white-spots'},
    'healthy': {'display_name': 'No Symptoms Detected', 'medication_page': None}
}

try:
    if os.path.exists(MODEL_FILE):
        model = tf.keras.models.load_model(MODEL_FILE)
        print(f" [IMAGE] Loaded Keras model: {MODEL_FILE}")
    else:
        model = None
        print(f" [IMAGE] Model file not found: {MODEL_FILE}")
except Exception as e:
    print(f" [IMAGE] Error loading model: {e}")
    model = None

def preprocess_image(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize((224, 224))
        img_array = tf.keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f" Preprocessing error: {e}")
        return None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg'}

def save_prediction_to_db(username, filename, disease, confidence):
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO disease_logs (username, filename, predicted_disease, confidence) VALUES (?, ?, ?, ?)",
                       (username, filename, disease, confidence))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f" [DB Error] {e}")

# ==========================================
# TEXT SYMPTOM CHECKER
# ==========================================
tfidf_vectorizer = None
document_tfidf_matrix = None
disease_data_list = []

def load_text_knowledge_base():
    global tfidf_vectorizer, document_tfidf_matrix, disease_data_list
    try:
        if os.path.exists(JSON_KB_FILE):
            with open(JSON_KB_FILE, 'r', encoding='utf-8') as f:
                disease_data_list = json.load(f)
            documents = [d['symptoms_text'] for d in disease_data_list]
            tfidf_vectorizer = TfidfVectorizer()
            document_tfidf_matrix = tfidf_vectorizer.fit_transform(documents)
            print(" [TEXT] Knowledge base loaded.")
        else:
            print(f" [TEXT] JSON file not found: {JSON_KB_FILE}")
    except Exception as e:
        print(f" [TEXT] Error loading Knowledge Base: {e}")

# ==========================================
# PREDICTION API ENDPOINTS
# ==========================================

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({'error': 'Model not loaded.'}), 500
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded.'}), 400

    file = request.files['file']
    current_user = request.form.get('username', 'Guest')

    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file.'}), 400

    try:
        img_bytes = file.read()
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        with open(file_path, "wb") as f:
            f.write(img_bytes)

        processed_img = preprocess_image(img_bytes)
        if processed_img is None:
            return jsonify({'error': 'Processing failed.'}), 400

        predictions = model.predict(processed_img, verbose=0)
        probabilities = predictions[0]
        max_conf = np.max(probabilities)
        idx = np.argmax(probabilities)
        predicted_label = DISEASE_LABELS[idx]
        
        CONFIDENCE_THRESHOLD = 0.50
        
        if max_conf >= CONFIDENCE_THRESHOLD:
            result_data = KNOWLEDGE_BASE.get(predicted_label, {})
            disease_name = result_data.get('display_name', predicted_label.capitalize())
            
            response_payload = {
                'disease': disease_name,
                'confidence': float(max_conf)
            }
            
            if predicted_label != 'healthy':
                medication_page = result_data.get('medication_page')
                if medication_page:
                    response_payload['medication_page'] = medication_page

            save_prediction_to_db(current_user, unique_filename, disease_name, float(max_conf))
            return jsonify(response_payload)
        else:
            return jsonify({
                'disease': 'Inconclusive (Detection Uncertain)',
                'confidence': float(max_conf)
            })

    except Exception as e:
        print(f" [EXCEPTION] {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/suggest', methods=['POST'])
def suggest():
    if tfidf_vectorizer is None: 
        return jsonify({'error': 'Text system not initialized.'}), 500
    
    data = request.get_json()
    user_query = data.get('symptoms', '')

    if not user_query or not user_query.strip(): 
        return jsonify([{"disease": "Invalid Input", "confidence_score": 0.0}])

    try:
        query_vec = tfidf_vectorizer.transform([user_query])
        similarities = cosine_similarity(query_vec, document_tfidf_matrix)[0]
        best_match_index = np.argmax(similarities)
        best_score = float(similarities[best_match_index])
        
        suggestions = []
        if best_score > 0.1:
            info = disease_data_list[best_match_index]
            suggestion_item = {
                "disease": info['disease_name'],
                "confidence_score": round(best_score, 4)
            }
            if "Healthy" not in info['disease_name']:
                suggestion_item["medication_page"] = info.get('medication_page')
            suggestions.append(suggestion_item)
        
        if not suggestions:
            return jsonify([{"disease": "No Matching Disease Found", "confidence_score": 0.0}])
        
        return jsonify(suggestions)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==========================================
# FRONTEND ROUTES
# ==========================================

@app.route('/')
def home():
    return render_template('landing_page.html')

@app.route('/login')
def login_page():
    return render_template('log_in_page.html')

@app.route('/signup')
@app.route('/register')
def signup_page():
    return render_template('sign_up_page.html')

@app.route('/upload')
@app.route('/predict-page')
def upload_page():
    return render_template('upload_page.html')

@app.route('/about')
def about_page():
   return render_template('about_us_page.html')

@app.route('/gallery')
def gallery_page():
    return render_template('gallary_page.html')

@app.route('/guide')
def guide_page():
    return render_template('guid_page.html')

@app.route('/identification')
def identification_page():
    return render_template('identification_page.html')

@app.route('/medication/fin-rot')
def medication_fin_rot():
    return render_template('fin_rot_medication_page.html')

@app.route('/medication/hole-in-the-head')
def medication_hole_in_head():
    return render_template('hole_in_head_medication_page.html')

@app.route('/medication/pop-eye')
def medication_pop_eye():
    return render_template('pop_eye_medication_page.html')

@app.route('/medication/white-spots')
def medication_white_spots():
    return render_template('white_spot.html')

@app.route('/medication/general')
def medication_general():
    return render_template('medication_page.html')

@app.route('/symptom-checker')
def symptom_checker_page():
    return render_template('symptom_checker.html')

@app.route('/profile')
def profile_page():
    return render_template('profile_page.html')


# ==========================================
# USER STATS API
# ==========================================

@app.route('/api/user-stats', methods=['GET'])
def get_user_stats():
    """ Get real-time user statistics"""
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Username required'}), 400
        
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Total scans
        cursor.execute("SELECT COUNT(*) FROM disease_logs WHERE username = ?", (username,))
        total_scans = cursor.fetchone()[0]
        
        # Diseases detected (unhealthy)
        cursor.execute(
            "SELECT COUNT(*) FROM disease_logs WHERE username = ? AND predicted_disease NOT LIKE '%Healthy%' AND predicted_disease NOT LIKE '%No Symptoms%'",
            (username,)
        )
        diseases_detected = cursor.fetchone()[0]
        
        # Healthy fish
        cursor.execute(
            "SELECT COUNT(*) FROM disease_logs WHERE username = ? AND (predicted_disease LIKE '%Healthy%' OR predicted_disease LIKE '%No Symptoms%')",
            (username,)
        )
        healthy_fish = cursor.fetchone()[0]
        
        # Last scan timestamp
        cursor.execute(
            "SELECT timestamp FROM disease_logs WHERE username = ? ORDER BY timestamp DESC LIMIT 1",
            (username,)
        )
        last_scan_row = cursor.fetchone()
        last_scan = last_scan_row[0] if last_scan_row else 'Never'
        
        conn.close()
        
        return jsonify({
            'total_scans': total_scans,
            'diseases_detected': diseases_detected,
            'healthy_fish': healthy_fish,
            'last_scan': last_scan,
            'status': 200
        }), 200
        
    except Exception as e:
        print(f" [STATS ERROR] {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/scan-history', methods=['GET'])
def get_scan_history():
    """ Get user's recent scan history"""
    try:
        username = request.args.get('username')
        limit = request.args.get('limit', 10)
        
        if not username:
            return jsonify({'error': 'Username required'}), 400
        
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT filename, predicted_disease, confidence, timestamp 
               FROM disease_logs WHERE username = ? ORDER BY timestamp DESC LIMIT ?""",
            (username, limit)
        )
        
        scans = cursor.fetchall()
        conn.close()
        
        scan_history = [
            {
                'filename': scan[0],
                'predicted_disease': scan[1],
                'confidence': scan[2],
                'timestamp': scan[3]
            }
            for scan in scans
        ]
        
        return jsonify(scan_history), 200
        
    except Exception as e:
        print(f" [HISTORY ERROR] {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/delete-account', methods=['POST'])
def delete_account():
    """Delete user account"""
    try:
        data = request.get_json()
        username = data.get('username')
        
        if not username:
            return jsonify({'error': 'Username required'}), 400
        
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM disease_logs WHERE username = ?", (username,))
        cursor.execute("DELETE FROM users WHERE username = ?", (username,))
        
        conn.commit()
        conn.close()
        
        # Clear session
        session.clear()
        
        print(f"  [DELETE] Account deleted: {username}")
        
        return jsonify({'message': 'Account deleted successfully', 'status': 200}), 200
        
    except Exception as e:
        print(f" [DELETE ERROR] {str(e)}")
        return jsonify({'error': str(e)}), 500


# --- Run Server ---
if __name__ == '__main__':
    load_text_knowledge_base()
    print("\n" + "="*60)
    print(" AQUAMED SYSTEM STARTING")
    print("="*60)
    print(f" Database: {DB_NAME}")
    print(f" Model: {MODEL_FILE}")
    print(f" Auth: Standard Username/Password")
    print(f" Features: Profile & Stats")
    print(f" Server: http://127.0.0.1:5000")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
