<?php $debug_class = ( is_debug() )? 'debug' : ''; ?>
<!doctype html <?php echo ( nebula_option('appcache_manifest') )? 'manifest="' . get_template_directory_uri() . '/includes/manifest.appcache"' : ''; ?>>
<!--[if lt IE 7]><html <?php language_attributes(); ?> class="<?php echo $debug_class; ?> no-js ie ie6 lt-ie7 lte-ie7 lt-ie8 lte-ie8 lt-ie9 lte-ie9 lt-ie10"><![endif]-->
<!--[if IE 7]><html <?php language_attributes(); ?> class="<?php echo $debug_class; ?> no-js ie ie7 lte-ie7 lt-ie8 lte-ie8 lt-ie9 lte-ie9 lt-ie10"><![endif]-->
<!--[if IE 8]><html <?php language_attributes(); ?> class="<?php echo $debug_class; ?> no-js ie ie8 lte-ie8 lt-ie9 lte-ie9 lt-ie10"><![endif]-->
<!--[if IE 9]><html <?php language_attributes(); ?> class="<?php echo $debug_class; ?> no-js ie ie9 lte-ie9 lt-ie10"><![endif]-->
<!--[if IEMobile]><html <?php language_attributes(); ?> class="<?php echo $debug_class; ?> no-js ie iem7" dir="ltr"><![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--><html <?php language_attributes(); ?> class=" <?php echo $debug_class; ?> no-js"><!--<![endif]-->
	<head>
		<?php do_action('nebula_head_open'); ?>

		<?php //Title tag is handled by WordPress core. ?>

		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
		<meta name="referrer" content="always">
		<meta charset="<?php bloginfo('charset'); ?>" />
		<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
		<meta name="HandheldFriendly" content="True" />
		<meta name="MobileOptimized" content="320" />
		<meta name="mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta class="theme-color" name="theme-color" content="<?php echo nebula_sass_color('primary'); ?>">
		<meta class="theme-color" name="msapplication-navbutton-color" content="<?php echo nebula_sass_color('primary'); ?>">
		<meta class="theme-color" name="apple-mobile-web-app-status-bar-style" content="<?php echo nebula_sass_color('primary'); ?>">

		<link rel="manifest" href="<?php echo get_template_directory_uri() . $GLOBALS['manifest_json']; ?>" />
		<link rel="profile" href="http://gmpg.org/xfn/11" />
		<?php nebula_prerender(); ?>

		<?php get_template_part('includes/metadata'); //All text components of metadata. ?>
		<?php get_template_part('includes/metagraphics'); //All graphic components of metadata. ?>

		<?php //Stylesheets are loaded at the top of functions.php (so they can be registerred and enqueued). ?>
		<?php wp_head(); ?>

		<?php get_template_part('includes/analytics'); //Google Analytics and other analytics trackers. ?>
	</head>
	<body <?php body_class(); ?>>
		<div id="fullbodywrapper">

			<div id="header">
				<div id="fb-root"></div>

				<?php do_action('nebula_body_open'); ?>

				<div id="mobilebarcon">
					<div class="row mobilenavcon">
						<div class="col-md-12">
							<a class="mobilenavtrigger alignleft" href="#mobilenav" title="Navigation"><i class="fa fa-bars"></i></a>
							<nav id="mobilenav">
								<?php
									if ( has_nav_menu('mobile') ){
										wp_nav_menu(array('theme_location' => 'mobile', 'depth' => '9999'));
									} elseif ( has_nav_menu('primary') ){
										wp_nav_menu(array('theme_location' => 'header', 'depth' => '9999'));
									}
								?>
							</nav><!--/mobilenav-->

							<form id="mobileheadersearch" class="nebula-search-iconable search" method="get" action="<?php echo home_url('/'); ?>">
								<?php
									if ( !empty($_GET['s']) || !empty($_GET['rs']) ) {
										$current_search = ( !empty($_GET['s']) )? $_GET['s'] : $_GET['rs'];
									}
									$header_search_placeholder = ( isset($current_search) )? $current_search : 'What are you looking for?' ;
								?>
								<input class="nebula-search open input search" type="search" name="s" placeholder="<?php echo $header_search_placeholder; ?>" autocomplete="off" x-webkit-speech />
							</form>
						</div><!--/col-->
					</div><!--/row-->
				</div><!--/topbarcon-->

				<?php if ( has_nav_menu('secondary') ): ?>
					<div id="secondarynavcon">
						<div class="container">
							<div class="row">
								<div class="col-md-12">
									<nav id="secondarynav">
					        			<?php wp_nav_menu(array('theme_location' => 'secondary', 'depth' => '2')); ?>
					        		</nav>
								</div><!--/col-->
							</div><!--/row-->
						</div><!--/container-->
					</div>
				<?php endif; ?>

				<div id="logonavcon">
					<div class="container">
						<div class="row">
							<div class="col-lg-4">
								<a class="logocon" href="<?php echo home_url(); ?>">
									<img class="svg" src="<?php echo get_template_directory_uri(); ?>/images/logo.svg" alt="<?php bloginfo('name'); ?>"/>
								</a>
							</div><!--/col-->
							<div class="col-lg-8">
								<?php if ( has_nav_menu('primary') ): ?>
									<nav id="primarynav" class="clearfix">
										<?php wp_nav_menu(array('theme_location' => 'primary', 'depth' => '2')); ?>
					        		</nav>
				        		<?php endif; ?>
				        	</div><!--/col-->
						</div><!--/row-->
					</div><!--/container-->
				</div>
			</div><!--/header-->

			<?php if ( !is_search() && (array_key_exists('s', $_GET) || array_key_exists('rs', $_GET)) ): ?>
				<div class="headerdrawercon">
					<div class="container">
						<hr />
						<div class="row">
							<div class="col-md-12 headerdrawer">
								<span>Your search returned only one result. You have been automatically redirected.</span>
								<a class="close" href="<?php the_permalink(); ?>"><i class="fa fa-times"></i></a>
								<?php echo get_search_form(); ?>
							</div><!--/col-->
						</div><!--/row-->
						<hr class="zero" />
					</div><!--/container-->
				</div>
			<?php elseif ( (is_page('search') || is_page_template('tpl-search.php')) && array_key_exists('invalid', $_GET) ): ?>
				<div class="headerdrawercon">
					<div class="container">
						<hr />
						<div class="row">
							<div class="col-md-12 headerdrawer invalid">
								<span>Your search was invalid. Please try again.</span>
								<a class="close" href="<?php the_permalink(); ?>"><i class="fa fa-times"></i></a>
								<?php echo get_search_form(); ?>
							</div><!--/col-->
						</div><!--/row-->
						<hr class="zero" />
					</div><!--/container-->
				</div>
			<?php elseif ( is_404() || !have_posts() || array_key_exists('s', $_GET) || is_page_template('http_status.php') ): ?>
				<div id="suggestedpage" class="headerdrawercon">
					<div class="container">
						<hr />
						<div class="row">
							<div class="col-md-12 headerdrawer">
								<h3>Did you mean?</h3>
								<p><a class="suggestion" href="#"></a></p>
								<a class="close" href="<?php the_permalink(); ?>"><i class="fa fa-times"></i></a>
							</div><!--/col-->
						</div><!--/row-->
						<hr class="zero" />
					</div><!--/container-->
				</div>
			<?php endif; ?>