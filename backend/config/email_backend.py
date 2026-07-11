import ssl
import smtplib
import dns.resolver

from django.core.mail.backends.smtp import EmailBackend, DNS_NAME


class ResolvedEmailBackend(EmailBackend):
    """SMTP backend that resolves EMAIL_HOST via Google DNS,
    bypassing the flaky systemd-resolved stub at 127.0.0.53."""

    def _resolve(self, hostname: str) -> str:
        resolver = dns.resolver.Resolver()
        resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
        resolver.timeout = 5
        resolver.lifetime = 10
        answers = resolver.resolve(hostname, "A")
        return answers[0].address

    def open(self):
        if self.connection:
            return False

        if self._partial_connection is not None:
            self._close_connection(self._partial_connection)
            self._partial_connection = None

        hostname = self.host
        ip = self._resolve(hostname)

        connection_params = {"local_hostname": DNS_NAME.get_fqdn()}
        if self.timeout is not None:
            connection_params["timeout"] = self.timeout
        if self.use_ssl:
            connection_params["context"] = self.ssl_context

        try:
            connection = self.connection_class(**connection_params)
            connection.connect(ip, self.port)
            connection._host = hostname  # for TLS server_hostname

            self._partial_connection = connection

            if not self.use_ssl and self.use_tls:
                connection.ehlo()
                connection.starttls(context=self.ssl_context)
                connection.ehlo()

            if self.username and self.password:
                connection.login(self.username, self.password)

            self.connection = self._partial_connection
            self._partial_connection = None
            return True
        except OSError:
            if not self.fail_silently:
                raise
