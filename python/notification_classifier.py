"""
Notification classification system.
Classifies notifications by sensitivity level and determines if they should be shown.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

# Default app classifications
DEFAULT_APP_CLASSIFICATIONS = {
    # Sensitive - should hide in privacy mode
    'sensitive': [
        'Gmail', 'Outlook', 'Mail', 'ProtonMail',  # Email
        'Bank of America', 'Chase', 'PayPal', 'Stripe',  # Banking
        'AWS', 'Google Cloud', 'Azure', 'GitHub',  # Dev/Cloud
        'Slack', 'Discord', 'Teams', 'Zoom',  # Private messaging
        '1Password', 'LastPass', 'Dashlane',  # Password managers
        'iCloud', 'OneDrive', 'Dropbox',  # Cloud storage
    ],
    # Moderate - show unless in strict privacy
    'moderate': [
        'Messenger', 'WhatsApp', 'Telegram', 'Signal',  # General chat
        'Twitter', 'Instagram', 'LinkedIn',  # Social media
        'Calendar', 'Notion', 'Evernote',  # Productivity
        'VS Code', 'JetBrains', 'Sublime',  # Code editors
    ],
    # Public - can always show
    'public': [
        'News', 'BBC', 'CNN', 'Reuters',  # News
        'YouTube', 'Spotify', 'Netflix', 'Twitch',  # Media
        'Safari', 'Chrome', 'Firefox',  # Browsers
        'Finder', 'Explorer',  # File managers
        'App Store', 'Play Store',  # App stores
    ],
}


class NotificationClassifier:
    """Classify notifications and filter based on sensitivity."""

    def __init__(self, config_path: str = 'python/data/app_sensitivity.json'):
        """
        Initialize notification classifier.

        Args:
            config_path: Path to store app classification configuration
        """
        self.config_path = Path(config_path)
        self.app_classifications: Dict[str, str] = {}
        self.load_config()

    def load_config(self) -> None:
        """Load classification configuration from file."""
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r') as f:
                    data = json.load(f)
                    self.app_classifications = data.get('app_classifications', {})
                logger.info(
                    f"[Classifier] Loaded {len(self.app_classifications)} "
                    "app classifications"
                )
            else:
                logger.info("[Classifier] No existing config found, using defaults")
                self._initialize_defaults()
        except Exception as e:
            logger.error(f"[Classifier] Error loading config: {e}")
            self._initialize_defaults()

    def save_config(self) -> None:
        """Save classification configuration to file."""
        try:
            self.config_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_path, 'w') as f:
                json.dump(
                    {'app_classifications': self.app_classifications},
                    f,
                    indent=2
                )
            logger.info(f"[Classifier] Saved app classifications to {self.config_path}")
        except Exception as e:
            logger.error(f"[Classifier] Error saving config: {e}")

    def _initialize_defaults(self) -> None:
        """Initialize with default classifications."""
        self.app_classifications = {}
        for sensitivity, apps in DEFAULT_APP_CLASSIFICATIONS.items():
            for app in apps:
                self.app_classifications[app.lower()] = sensitivity
        self.save_config()

    def classify_app(self, app_name: str) -> str:
        """
        Classify an application by sensitivity.

        Args:
            app_name: Name of the application

        Returns:
            Sensitivity level: 'sensitive', 'moderate', or 'public'
        """
        app_lower = app_name.lower()

        # Exact match
        if app_lower in self.app_classifications:
            return self.app_classifications[app_lower]

        # Substring match (case-insensitive)
        for app_pattern, sensitivity in self.app_classifications.items():
            if app_pattern in app_lower or app_lower in app_pattern:
                return sensitivity

        # Default to moderate if unknown
        return 'moderate'

    def should_show_notification(
        self,
        app_name: str,
        privacy_mode_active: bool,
        user_looking_at_screen: bool = True,
        payload_text: str = ""
    ) -> Tuple[bool, str]:
        """
        Determine if a notification should be shown based on app name and payload text NLP analysis.

        Rules:
        - Hide all notifications if user isn't looking at screen
        - Parse payload_text for strict sensitive keywords (finance, passwords). Hide if in privacy mode.
        - Check app sensitivity
        - Always show public notifications
        - Show moderate notifications unless in privacy mode
        - Never show sensitive notifications in privacy mode

        Args:
            app_name: Name of the app sending notification
            privacy_mode_active: Whether privacy mode is active
            user_looking_at_screen: Whether user is paying attention

        Returns:
            Tuple of (should_show: bool, reason: str)
        """
        if not user_looking_at_screen:
            return False, 'user_not_looking'

        # NLP Payload check
        sensitive_keywords = ['password', 'auth', 'code', 'reset', 'bank', 'transfer', 'payment', 'confidential', 'secret', 'invoice']
        payload_lower = payload_text.lower()
        if any(keyword in payload_lower for keyword in sensitive_keywords):
            if privacy_mode_active:
                return False, 'sensitive_payload_in_privacy_mode'
            else:
                return True, 'sensitive_payload_allowed_outside_privacy'

        sensitivity = self.classify_app(app_name)

        if sensitivity == 'sensitive':
            if privacy_mode_active:
                return False, 'sensitive_in_privacy_mode'
            else:
                return True, 'sensitive_allowed_outside_privacy'

        elif sensitivity == 'moderate':
            if privacy_mode_active:
                return False, 'moderate_in_privacy_mode'
            else:
                return True, 'moderate_allowed'

        else:  # public
            return True, 'public_always_allowed'

    def set_app_sensitivity(self, app_name: str, sensitivity: str) -> bool:
        """
        Set sensitivity level for an app.

        Args:
            app_name: Name of the app
            sensitivity: 'sensitive', 'moderate', or 'public'

        Returns:
            True if successful
        """
        if sensitivity not in ['sensitive', 'moderate', 'public']:
            logger.warning(f"[Classifier] Invalid sensitivity: {sensitivity}")
            return False

        self.app_classifications[app_name.lower()] = sensitivity
        self.save_config()
        logger.info(f"[Classifier] Set {app_name} to {sensitivity}")
        return True

    def get_app_sensitivity(self, app_name: str) -> str:
        """Get current sensitivity for an app."""
        return self.classify_app(app_name)

    def get_all_classifications(self) -> Dict[str, str]:
        """Get all app classifications."""
        return self.app_classifications.copy()

    def get_classification_summary(self) -> Dict[str, List[str]]:
        """Get summary of classifications by sensitivity level."""
        summary = {'sensitive': [], 'moderate': [], 'public': []}

        for app, sensitivity in self.app_classifications.items():
            if sensitivity in summary:
                summary[sensitivity].append(app)

        return summary

    def reset_to_defaults(self) -> None:
        """Reset classifications to defaults."""
        logger.warning("[Classifier] Resetting to default classifications")
        self._initialize_defaults()

